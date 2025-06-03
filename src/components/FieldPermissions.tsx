
import React, { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Type, Eye, Edit, CheckCircle } from 'lucide-react';
import { salesforceService } from '@/services/salesforceService';

interface Field {
  name: string;
  label: string;
  type: string;
  isCustom: boolean;
  isRequired: boolean;
}

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
  const [fields, setFields] = useState<Field[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedObject) {
      loadFields();
    } else {
      setFields([]);
    }
  }, [selectedObject]);

  const loadFields = async () => {
    setLoading(true);
    try {
      const fieldsData = await salesforceService.getObjectFields(selectedObject);
      setFields(fieldsData);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFields = fields.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFieldPermissionChange = (fieldName: string, permissionType: 'read' | 'edit', value: boolean) => {
    const fieldPermissions = permissions[fieldName] || {};
    onPermissionsChange({
      ...permissions,
      [fieldName]: {
        ...fieldPermissions,
        [permissionType]: value
      }
    });
  };

  const handleBulkAction = (action: 'read-all' | 'edit-all' | 'clear-all') => {
    const newPermissions = { ...permissions };
    
    filteredFields.forEach(field => {
      if (action === 'clear-all') {
        delete newPermissions[field.name];
      } else if (action === 'read-all') {
        newPermissions[field.name] = { ...newPermissions[field.name], read: true };
      } else if (action === 'edit-all') {
        newPermissions[field.name] = { 
          ...newPermissions[field.name], 
          read: true, 
          edit: true 
        };
      }
    });
    
    onPermissionsChange(newPermissions);
  };

  const getSelectedFieldsCount = () => {
    return Object.keys(permissions).filter(fieldName => 
      permissions[fieldName].read || permissions[fieldName].edit
    ).length;
  };

  if (!selectedObject) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Type className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">Select an Object First</p>
        <p className="text-sm">Choose an object to configure field permissions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Field Permissions for {selectedObject}
          </h3>
          {getSelectedFieldsCount() > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              {getSelectedFieldsCount()} field(s) configured
            </Badge>
          )}
        </div>

        <div className="flex space-x-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('read-all')}
              disabled={filteredFields.length === 0}
            >
              Grant Read All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('edit-all')}
              disabled={filteredFields.length === 0}
            >
              Grant Edit All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('clear-all')}
              disabled={Object.keys(permissions).length === 0}
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Fields List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading fields...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredFields.map((field) => {
            const fieldPerms = permissions[field.name] || {};
            return (
              <Card
                key={field.name}
                className={`transition-all ${
                  fieldPerms.read || fieldPerms.edit ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Type className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 truncate">
                            {field.label}
                          </span>
                          {field.isCustom && (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                          {field.isRequired && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-600">API: {field.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {field.type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Read Permission */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={fieldPerms.read || false}
                          onChange={(checked) => 
                            handleFieldPermissionChange(field.name, 'read', checked)
                          }
                        />
                        <Eye className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Read</span>
                      </div>

                      {/* Edit Permission */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={fieldPerms.edit || false}
                          onChange={(checked) => {
                            handleFieldPermissionChange(field.name, 'edit', checked);
                            // Auto-enable read when edit is enabled
                            if (checked && !fieldPerms.read) {
                              handleFieldPermissionChange(field.name, 'read', true);
                            }
                          }}
                        />
                        <Edit className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Edit</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredFields.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No fields found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default FieldPermissions;
