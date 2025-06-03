public with sharing class ProfilePermissionService {

    /**
     * @description Wrapper class for SObject information.
     */
    public class SObjectWrapper {
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public String apiName { get; set; }
        @AuraEnabled public Boolean isCustom { get; set; }

        public SObjectWrapper(String label, String apiName, Boolean isCustom) {
            this.label = label;
            this.apiName = apiName;
            this.isCustom = isCustom;
        }
    }

    /**
     * @description Wrapper class for SObject Field information.
     */
    public class FieldWrapper {
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public String apiName { get; set; }
        @AuraEnabled public String type { get; set; }
        @AuraEnabled public Boolean isCustom { get; set; }
        @AuraEnabled public Boolean isRequired { get; set; } // Approximated by !isNillable

        public FieldWrapper(String label, String apiName, String type, Boolean isCustom, Boolean isRequired) {
            this.label = label;
            this.apiName = apiName;
            this.type = type;
            this.isCustom = isCustom;
            this.isRequired = isRequired;
        }
    }

    /**
     * @description Wrapper class for deserializing permission update requests.
     */
    public class PermissionUpdateRequest {
        @AuraEnabled public List<String> profiles { get; set; }
        @AuraEnabled public String objectName { get; set; }
        @AuraEnabled public ObjectPermissionsWrapper objectPermissions { get; set; }
        @AuraEnabled public Map<String, FieldPermissionWrapper> fieldPermissions { get; set; }

        public PermissionUpdateRequest() {
            this.profiles = new List<String>();
            this.objectPermissions = new ObjectPermissionsWrapper();
            this.fieldPermissions = new Map<String, FieldPermissionWrapper>();
        }
    }

    /**
     * @description Wrapper for object-level permissions within PermissionUpdateRequest.
     */
    public class ObjectPermissionsWrapper {
        @AuraEnabled public Boolean read { get; set; }
        @AuraEnabled public Boolean create { get; set; }
        @AuraEnabled public Boolean edit { get; set; }
        @AuraEnabled public Boolean delete { get; set; }
        @AuraEnabled public Boolean viewAll { get; set; }
        @AuraEnabled public Boolean modifyAll { get; set; }

        public ObjectPermissionsWrapper() {
            // Initialize with default false values
            this.read = false;
            this.create = false;
            this.edit = false;
            this.delete = false;
            this.viewAll = false;
            this.modifyAll = false;
        }
    }

    /**
     * @description Wrapper for field-level permissions within PermissionUpdateRequest.
     */
    public class FieldPermissionWrapper {
        @AuraEnabled public Boolean read { get; set; }
        @AuraEnabled public Boolean edit { get; set; }

        public FieldPermissionWrapper() {
            this.read = false;
            this.edit = false;
        }
    }

    /**
     * @description Retrieves a list of profiles.
     * @return List of Profile SObjects
     */
    @AuraEnabled(cacheable=true)
    public static List<Profile> getProfiles() {
        try {
            return [
                SELECT Id, Name, License.Name, Description
                FROM Profile
                ORDER BY Name
            ];
        } catch (Exception e) {
            System.debug('Error in getProfiles: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving profiles: ' + e.getMessage());
        }
    }

    /**
     * @description Retrieves a list of SObjects.
     * @return List of SObjectWrapper
     */
    @AuraEnabled(cacheable=true)
    public static List<SObjectWrapper> getSObjects() {
        List<SObjectWrapper> sObjectWrappers = new List<SObjectWrapper>();
        try {
            Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
            for (String sObjectName : globalDescribe.keySet()) {
                Schema.DescribeSObjectResult sObjectDescribe = globalDescribe.get(sObjectName).getDescribe();
                if (sObjectDescribe.isCreateable() && 
                    sObjectDescribe.isAccessible() &&
                    !sObjectName.endsWith('__History') &&
                    !sObjectName.endsWith('__Share') &&
                    !sObjectName.endsWith('__ChangeEvent') &&
                    !sObjectName.endsWith('__Feed') &&
                    !sObjectName.endsWith('__Tag')) {
                    sObjectWrappers.add(new SObjectWrapper(
                        sObjectDescribe.getLabel(),
                        sObjectDescribe.getName(),
                        sObjectDescribe.isCustom()
                    ));
                }
            }
            sObjectWrappers.sort((a, b) -> a.label.compareTo(b.label));
            return sObjectWrappers;
        } catch (Exception e) {
            System.debug('Error in getSObjects: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving SObjects: ' + e.getMessage());
        }
    }

    /**
     * @description Retrieves a list of fields for a given SObject.
     * @param sObjectApiName The API name of the SObject.
     * @return List of FieldWrapper
     */
    @AuraEnabled(cacheable=true)
    public static List<FieldWrapper> getSObjectFields(String sObjectApiName) {
        List<FieldWrapper> fieldWrappers = new List<FieldWrapper>();
        try {
            if (String.isBlank(sObjectApiName)) {
                throw new AuraHandledException('SObject API name cannot be blank.');
            }
            Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
            Schema.SObjectType sObjectType = globalDescribe.get(sObjectApiName);
            if (sObjectType == null) {
                throw new AuraHandledException('SObject not found: ' + sObjectApiName);
            }
            Map<String, Schema.SObjectField> fieldMap = sObjectType.getDescribe().fields.getMap();
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                if (fieldDescribe.isPermissionable()) {
                     fieldWrappers.add(new FieldWrapper(
                        fieldDescribe.getLabel(),
                        fieldDescribe.getName(),
                        String.valueOf(fieldDescribe.getType()),
                        fieldDescribe.isCustom(),
                        !fieldDescribe.isNillable()
                    ));
                }
            }
            fieldWrappers.sort((a, b) -> a.label.compareTo(b.label));
            return fieldWrappers;
        } catch (Exception e) {
            System.debug('Error in getSObjectFields for ' + sObjectApiName + ': ' + e.getMessage());
            if (e instanceof AuraHandledException) { throw e; }
            throw new AuraHandledException('Error retrieving fields for ' + sObjectApiName + ': ' + e.getMessage());
        }
    }

    /**
     * @description Updates object and field permissions for specified profiles.
     * @param jsonData JSON string containing profile IDs, object name, object permissions, and field permissions.
     * @return Map<String, Object> indicating success or failure and a message.
     */
    @AuraEnabled
    public static Map<String, Object> updatePermissions(String jsonData) {
        Map<String, Object> result = new Map<String, Object>();
        try {
            PermissionUpdateRequest request = (PermissionUpdateRequest)JSON.deserialize(jsonData, PermissionUpdateRequest.class);

            if (request == null || request.profiles == null || request.profiles.isEmpty() || String.isBlank(request.objectName)) {
                result.put('success', false);
                result.put('message', 'Invalid request data. Profiles, object name are required.');
                return result;
            }

            // Fetch Profile Names from IDs as Metadata API uses Profile Names for fullName
            Map<Id, String> profileIdToNameMap = new Map<Id, String>();
            for (Profile p : [SELECT Id, Name FROM Profile WHERE Id IN :request.profiles]) {
                profileIdToNameMap.put(p.Id, p.Name);
            }

            Metadata.Container container = new Metadata.Container();
            for (String profileId : request.profiles) {
                String profileName = profileIdToNameMap.get(profileId);
                if (String.isBlank(profileName)) {
                    System.debug('Profile name not found for ID: ' + profileId + '. Skipping.');
                    // Optionally, collect these errors and report them
                    continue; 
                }

                Metadata.Profile profileMetadata = new Metadata.Profile();
                profileMetadata.fullName = profileName;

                // Object Permissions
                if (request.objectPermissions != null) {
                    Metadata.ProfileObjectPermissions objectPerms = new Metadata.ProfileObjectPermissions();
                    objectPerms.object = request.objectName;
                    objectPerms.allowRead = request.objectPermissions.read;
                    objectPerms.allowCreate = request.objectPermissions.create;
                    objectPerms.allowEdit = request.objectPermissions.edit;
                    objectPerms.allowDelete = request.objectPermissions.delete;
                    objectPerms.viewAllRecords = request.objectPermissions.viewAll;
                    objectPerms.modifyAllRecords = request.objectPermissions.modifyAll;
                    
                    if (profileMetadata.objectPermissions == null) {
                        profileMetadata.objectPermissions = new List<Metadata.ProfileObjectPermissions>();
                    }
                    profileMetadata.objectPermissions.add(objectPerms);
                }

                // Field Permissions
                if (request.fieldPermissions != null && !request.fieldPermissions.isEmpty()) {
                    profileMetadata.fieldPermissions = new List<Metadata.ProfileFieldLevelSecurity>();
                    for (String fieldApiName : request.fieldPermissions.keySet()) {
                        FieldPermissionWrapper fieldPerm = request.fieldPermissions.get(fieldApiName);
                        if (fieldPerm != null) {
                            Metadata.ProfileFieldLevelSecurity fieldSecurity = new Metadata.ProfileFieldLevelSecurity();
                            fieldSecurity.field = request.objectName + '.' + fieldApiName;
                            fieldSecurity.readable = fieldPerm.read;
                            fieldSecurity.editable = fieldPerm.edit;
                            profileMetadata.fieldPermissions.add(fieldSecurity);
                        }
                    }
                }
                container.addMetadata(profileMetadata);
            }

            if (container.getMetadata().isEmpty()) {
                 result.put('success', false);
                 result.put('message', 'No valid profiles found or no permissions to update.');
                 return result;
            }

            // Enqueue deployment
            // For simplicity, using null for callback. Implement Metadata.DeployCallback for production.
            Id asyncResultId = Metadata.Operations.enqueueDeployment(container, null); 
            
            result.put('success', true);
            result.put('message', 'Permissions update deployment enqueued. Job ID: ' + asyncResultId);
            result.put('jobId', asyncResultId);

        } catch (Exception e) {
            System.debug('Error in updatePermissions: ' + e.getMessage() + '\nStack Trace: ' + e.getStackTraceString());
            result.put('success', false);
            result.put('message', 'Error updating permissions: ' + e.getMessage());
        }
        return result;
    }
}
