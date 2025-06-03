
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Type, CheckCircle, Eye, Edit } from 'lucide-react';
import { salesforceService } from '@/services/salesforceService';

interface FieldPermissionsProps {
  selectedObject: string;
  permissions: any;
  onPermissionsChange: (permissions: any) => void;
}

const FieldPermissions: React.FC<FieldPermissionsProps> = ({
  selectedObject,
  permissions,
  onPermissionsChange
}) => {
  const [fields, setFields] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedObject) {
      loadFields();
    } else {
      setFields([]);
    }
  }, [selectedObject]);

  const loadFields = async () => {
    if (!selectedObject) return;
    
    setIsLoading(true);
    try {
      const fieldsData = await salesforceService.getObjectFields(selectedObject);
      setFields(fieldsData);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFields = fields.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFieldPermissionChange = (fieldName: string, permissionType: 'read' | 'edit', value: boolean) => {
    const newPermissions = { ...permissions };
    
    if (!newPermissions[fieldName]) {
      newPermissions[fieldName] = { read: false, edit: false };
    }
    
    newPermissions[fieldName][permissionType] = value;
    
    // If edit is checked, read must also be checked
    if (permissionType === 'edit' && value) {
      newPermissions[fieldName].read = true;
    }
    
    // If read is unchecked, edit must also be unchecked
    if (permissionType === 'read' && !value) {
      newPermissions[fieldName].edit = false;
    }
    
    // Remove field if no permissions are set
    if (!newPermissions[fieldName].read && !newPermissions[fieldName].edit) {
      delete newPermissions[fieldName];
    }
    
    onPermissionsChange(newPermissions);
  };

  const handleBulkReadAll = () => {
    const newPermissions = { ...permissions };
    filteredFields.forEach(field => {
      newPermissions[field.name] = { 
        read: true, 
        edit: newPermissions[field.name]?.edit || false 
      };
    });
    onPermissionsChange(newPermissions);
  };

  const handleBulkEditAll = () => {
    const newPermissions = { ...permissions };
    filteredFields.forEach(field => {
      newPermissions[field.name] = { read: true, edit: true };
    });
    onPermissionsChange(newPermissions);
  };

  const handleClearAll = () => {
    const newPermissions = { ...permissions };
    filteredFields.forEach(field => {
      delete newPermissions[field.name];
    });
    onPermissionsChange(newPermissions);
  };

  const getConfiguredFieldsCount = () => {
    return Object.keys(permissions).filter(fieldName => 
      permissions[fieldName].read || permissions[fieldName].edit
    ).length;
  };

  if (!selectedObject) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Type className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">Select an Object First</p>
        <p className="text-sm">Choose an object to configure field-level permissions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Type className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900">Field Permissions</h3>
        </div>
        <Badge variant="outline" className="text-purple-600 border-purple-600">
          {getConfiguredFieldsCount()} field(s) configured
        </Badge>
      </div>

      {/* Search and Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search fields by name or label..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReadAll}
                disabled={isLoading || filteredFields.length === 0}
              >
                Grant Read All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkEditAll}
                disabled={isLoading || filteredFields.length === 0}
              >
                Grant Edit All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={isLoading || getConfiguredFieldsCount() === 0}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fields List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading fields...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Fields ({filteredFields.length})</CardTitle>
            <CardDescription>Configure read and edit permissions for individual fields</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredFields.length > 0 ? (
                <div className="space-y-0">
                  {filteredFields.map((field, index) => (
                    <div key={field.name}>
                      <div className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <Type className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {field.label}
                              </h4>
                              {field.isCustom && (
                                <Badge variant="outline" className="text-xs">Custom</Badge>
                              )}
                              {field.isRequired && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              API Name: {field.name} • Type: {field.type}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={permissions[field.name]?.read || false}
                                onCheckedChange={(checked) => 
                                  handleFieldPermissionChange(field.name, 'read', !!checked)
                                }
                              />
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-600">Read</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={permissions[field.name]?.edit || false}
                                onCheckedChange={(checked) => 
                                  handleFieldPermissionChange(field.name, 'edit', !!checked)
                                }
                              />
                              <div className="flex items-center space-x-1">
                                <Edit className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-600">Edit</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < filteredFields.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Type className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No fields found matching your search.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FieldPermissions;
