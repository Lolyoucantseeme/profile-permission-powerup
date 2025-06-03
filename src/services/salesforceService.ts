
// Mock Salesforce service for demonstration
// In a real implementation, this would connect to Salesforce APIs

export const salesforceService = {
  // Get all profiles
  getProfiles: async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return [
      {
        id: 'prof1',
        name: 'System Administrator',
        userLicense: 'Salesforce',
        description: 'Complete access to all data and functionality',
        userCount: 12
      },
      {
        id: 'prof2',
        name: 'Standard User',
        userLicense: 'Salesforce',
        description: 'Standard user access with limited administrative permissions',
        userCount: 145
      },
      {
        id: 'prof3',
        name: 'Sales Manager',
        userLicense: 'Salesforce',
        description: 'Enhanced sales permissions for team management',
        userCount: 8
      },
      {
        id: 'prof4',
        name: 'Marketing User',
        userLicense: 'Salesforce',
        description: 'Marketing-focused permissions for campaigns and leads',
        userCount: 25
      },
      {
        id: 'prof5',
        name: 'Customer Community User',
        userLicense: 'Customer Community',
        description: 'External customer access to support cases and knowledge',
        userCount: 1250
      },
      {
        id: 'prof6',
        name: 'Partner User',
        userLicense: 'Partner Community',
        description: 'Partner portal access for channel management',
        userCount: 67
      }
    ];
  },

  // Get all objects
  getObjects: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        name: 'Account',
        label: 'Account',
        description: 'Companies and organizations',
        isCustom: false
      },
      {
        name: 'Contact',
        label: 'Contact',
        description: 'Individual people associated with accounts',
        isCustom: false
      },
      {
        name: 'Lead',
        label: 'Lead',
        description: 'Potential customers and prospects',
        isCustom: false
      },
      {
        name: 'Opportunity',
        label: 'Opportunity',
        description: 'Sales deals and revenue opportunities',
        isCustom: false
      },
      {
        name: 'Case',
        label: 'Case',
        description: 'Customer service issues and requests',
        isCustom: false
      },
      {
        name: 'Product2',
        label: 'Product',
        description: 'Products and services offered',
        isCustom: false
      },
      {
        name: 'Custom_Project__c',
        label: 'Project',
        description: 'Custom project management object',
        isCustom: true
      },
      {
        name: 'Custom_Invoice__c',
        label: 'Invoice',
        description: 'Custom billing and invoice tracking',
        isCustom: true
      }
    ];
  },

  // Get fields for a specific object
  getObjectFields: async (objectName: string) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const fieldsByObject: { [key: string]: any[] } = {
      'Account': [
        { name: 'Name', label: 'Account Name', type: 'Text', isCustom: false, isRequired: true },
        { name: 'Phone', label: 'Phone', type: 'Phone', isCustom: false, isRequired: false },
        { name: 'Website', label: 'Website', type: 'URL', isCustom: false, isRequired: false },
        { name: 'Industry', label: 'Industry', type: 'Picklist', isCustom: false, isRequired: false },
        { name: 'AnnualRevenue', label: 'Annual Revenue', type: 'Currency', isCustom: false, isRequired: false },
        { name: 'Custom_Priority__c', label: 'Priority Level', type: 'Picklist', isCustom: true, isRequired: false }
      ],
      'Contact': [
        { name: 'FirstName', label: 'First Name', type: 'Text', isCustom: false, isRequired: false },
        { name: 'LastName', label: 'Last Name', type: 'Text', isCustom: false, isRequired: true },
        { name: 'Email', label: 'Email', type: 'Email', isCustom: false, isRequired: false },
        { name: 'Phone', label: 'Phone', type: 'Phone', isCustom: false, isRequired: false },
        { name: 'Title', label: 'Title', type: 'Text', isCustom: false, isRequired: false },
        { name: 'Custom_Preferred_Contact__c', label: 'Preferred Contact Method', type: 'Picklist', isCustom: true, isRequired: false }
      ],
      'Lead': [
        { name: 'FirstName', label: 'First Name', type: 'Text', isCustom: false, isRequired: false },
        { name: 'LastName', label: 'Last Name', type: 'Text', isCustom: false, isRequired: true },
        { name: 'Company', label: 'Company', type: 'Text', isCustom: false, isRequired: true },
        { name: 'Status', label: 'Lead Status', type: 'Picklist', isCustom: false, isRequired: true },
        { name: 'Rating', label: 'Rating', type: 'Picklist', isCustom: false, isRequired: false },
        { name: 'Custom_Lead_Score__c', label: 'Lead Score', type: 'Number', isCustom: true, isRequired: false }
      ],
      'Opportunity': [
        { name: 'Name', label: 'Opportunity Name', type: 'Text', isCustom: false, isRequired: true },
        { name: 'Amount', label: 'Amount', type: 'Currency', isCustom: false, isRequired: false },
        { name: 'CloseDate', label: 'Close Date', type: 'Date', isCustom: false, isRequired: true },
        { name: 'StageName', label: 'Stage', type: 'Picklist', isCustom: false, isRequired: true },
        { name: 'Probability', label: 'Probability (%)', type: 'Percent', isCustom: false, isRequired: false },
        { name: 'Custom_Competitor__c', label: 'Primary Competitor', type: 'Text', isCustom: true, isRequired: false }
      ]
    };

    return fieldsByObject[objectName] || [
      { name: 'Name', label: 'Name', type: 'Text', isCustom: false, isRequired: true },
      { name: 'CreatedDate', label: 'Created Date', type: 'DateTime', isCustom: false, isRequired: false },
      { name: 'LastModifiedDate', label: 'Last Modified Date', type: 'DateTime', isCustom: false, isRequired: false }
    ];
  },

  // Apply bulk permissions
  applyBulkPermissions: async (data: {
    profiles: string[];
    objectPermissions: any;
    fieldPermissions: any;
    objectName: string;
  }) => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API processing time
    
    console.log('Applying bulk permissions:', data);
    
    // In a real implementation, this would:
    // 1. Authenticate with Salesforce
    // 2. Use Metadata API to update profile permissions
    // 3. Handle errors and rollback if needed
    // 4. Return success/failure status
    
    return {
      success: true,
      message: 'Permissions applied successfully',
      profilesUpdated: data.profiles.length,
      timestamp: new Date().toISOString()
    };
  }
};
