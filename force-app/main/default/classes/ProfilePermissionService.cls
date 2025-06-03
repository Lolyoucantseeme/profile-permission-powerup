
public with sharing class ProfilePermissionService {
    
    @AuraEnabled(cacheable=true)
    public static List<Profile> getProfiles() {
        try {
            return [
                SELECT Id, Name, UserLicense.Name, Description 
                FROM Profile 
                WHERE UserLicense.Name IN ('Salesforce', 'Salesforce Platform', 'Customer Community', 'Partner Community')
                ORDER BY Name
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving profiles: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<SObjectWrapper> getSObjects() {
        try {
            List<SObjectWrapper> sObjects = new List<SObjectWrapper>();
            
            for (Schema.SObjectType objType : Schema.getGlobalDescribe().values()) {
                Schema.DescribeSObjectResult objDescribe = objType.getDescribe();
                
                // Filter for commonly used objects and custom objects
                if (objDescribe.isAccessible() && objDescribe.isQueryable() && 
                    (objDescribe.isCustom() || isStandardObjectOfInterest(objDescribe.getName()))) {
                    
                    SObjectWrapper wrapper = new SObjectWrapper();
                    wrapper.apiName = objDescribe.getName();
                    wrapper.label = objDescribe.getLabel();
                    wrapper.isCustom = objDescribe.isCustom();
                    sObjects.add(wrapper);
                }
            }
            
            sObjects.sort();
            return sObjects;
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving SObjects: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<FieldWrapper> getSObjectFields(String sObjectApiName) {
        try {
            List<FieldWrapper> fields = new List<FieldWrapper>();
            
            Schema.SObjectType objType = Schema.getGlobalDescribe().get(sObjectApiName);
            if (objType == null) {
                throw new AuraHandledException('SObject not found: ' + sObjectApiName);
            }
            
            Schema.DescribeSObjectResult objDescribe = objType.getDescribe();
            Map<String, Schema.SObjectField> fieldMap = objDescribe.fields.getMap();
            
            for (Schema.SObjectField field : fieldMap.values()) {
                Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                
                if (fieldDescribe.isAccessible() && !fieldDescribe.isCalculated()) {
                    FieldWrapper wrapper = new FieldWrapper();
                    wrapper.apiName = fieldDescribe.getName();
                    wrapper.label = fieldDescribe.getLabel();
                    wrapper.type = String.valueOf(fieldDescribe.getType());
                    wrapper.isCustom = fieldDescribe.isCustom();
                    wrapper.isRequired = !fieldDescribe.isNillable() && !fieldDescribe.isDefaultedOnCreate();
                    fields.add(wrapper);
                }
            }
            
            fields.sort();
            return fields;
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving fields: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static ResponseWrapper updatePermissions(String jsonData) {
        try {
            PermissionRequest request = (PermissionRequest) JSON.deserialize(jsonData, PermissionRequest.class);
            
            // Create metadata deployment for profile permissions
            List<Metadata.Metadata> metadataList = new List<Metadata.Metadata>();
            
            for (String profileId : request.profiles) {
                Profile prof = [SELECT Name FROM Profile WHERE Id = :profileId LIMIT 1];
                
                Metadata.Profile profileMetadata = new Metadata.Profile();
                profileMetadata.fullName = prof.Name;
                
                // Object Permissions
                if (request.objectPermissions != null && !request.objectPermissions.isEmpty()) {
                    Metadata.ProfileObjectPermissions objPerm = new Metadata.ProfileObjectPermissions();
                    objPerm.object_x = request.objectName;
                    objPerm.allowCreate = (Boolean) request.objectPermissions.get('create');
                    objPerm.allowDelete = (Boolean) request.objectPermissions.get('delete');
                    objPerm.allowEdit = (Boolean) request.objectPermissions.get('edit');
                    objPerm.allowRead = (Boolean) request.objectPermissions.get('read');
                    objPerm.modifyAllRecords = (Boolean) request.objectPermissions.get('modifyAll');
                    objPerm.viewAllRecords = (Boolean) request.objectPermissions.get('viewAll');
                    
                    profileMetadata.objectPermissions = new List<Metadata.ProfileObjectPermissions>{ objPerm };
                }
                
                // Field Permissions
                if (request.fieldPermissions != null && !request.fieldPermissions.isEmpty()) {
                    List<Metadata.ProfileFieldLevelSecurity> fieldPerms = new List<Metadata.ProfileFieldLevelSecurity>();
                    
                    for (String fieldName : request.fieldPermissions.keySet()) {
                        Map<String, Object> fieldPerm = (Map<String, Object>) request.fieldPermissions.get(fieldName);
                        
                        Metadata.ProfileFieldLevelSecurity fieldSecurity = new Metadata.ProfileFieldLevelSecurity();
                        fieldSecurity.field = request.objectName + '.' + fieldName;
                        fieldSecurity.readable = (Boolean) fieldPerm.get('read');
                        fieldSecurity.editable = (Boolean) fieldPerm.get('edit');
                        
                        fieldPerms.add(fieldSecurity);
                    }
                    
                    profileMetadata.fieldPermissions = fieldPerms;
                }
                
                metadataList.add(profileMetadata);
            }
            
            // Deploy metadata changes
            Metadata.DeployContainer deployContainer = new Metadata.DeployContainer();
            for (Metadata.Metadata metadata : metadataList) {
                deployContainer.addMetadata(metadata);
            }
            
            Metadata.AsyncResult result = Metadata.Operations.deploy(deployContainer, null);
            
            ResponseWrapper response = new ResponseWrapper();
            response.success = true;
            response.jobId = result.id;
            response.message = 'Permission update deployment initiated successfully.';
            
            return response;
            
        } catch (Exception e) {
            ResponseWrapper response = new ResponseWrapper();
            response.success = false;
            response.message = 'Error updating permissions: ' + e.getMessage();
            return response;
        }
    }
    
    private static Boolean isStandardObjectOfInterest(String objectName) {
        Set<String> standardObjects = new Set<String>{
            'Account', 'Contact', 'Lead', 'Opportunity', 'Case', 'Product2', 
            'Campaign', 'Event', 'Task', 'User', 'Asset', 'Contract'
        };
        return standardObjects.contains(objectName);
    }
    
    // Wrapper Classes
    public class SObjectWrapper implements Comparable {
        @AuraEnabled public String apiName { get; set; }
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public Boolean isCustom { get; set; }
        
        public Integer compareTo(Object obj) {
            SObjectWrapper other = (SObjectWrapper) obj;
            return this.label.compareTo(other.label);
        }
    }
    
    public class FieldWrapper implements Comparable {
        @AuraEnabled public String apiName { get; set; }
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public String type { get; set; }
        @AuraEnabled public Boolean isCustom { get; set; }
        @AuraEnabled public Boolean isRequired { get; set; }
        
        public Integer compareTo(Object obj) {
            FieldWrapper other = (FieldWrapper) obj;
            return this.label.compareTo(other.label);
        }
    }
    
    public class PermissionRequest {
        public List<String> profiles { get; set; }
        public String objectName { get; set; }
        public Map<String, Object> objectPermissions { get; set; }
        public Map<String, Object> fieldPermissions { get; set; }
    }
    
    public class ResponseWrapper {
        @AuraEnabled public Boolean success { get; set; }
        @AuraEnabled public String message { get; set; }
        @AuraEnabled public String jobId { get; set; }
    }
}
