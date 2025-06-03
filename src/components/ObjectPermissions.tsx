
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Eye, Edit, Plus, Trash2, Shield } from 'lucide-react';

interface SalesforceObject {
  name: string;
  label: string;
  description: string;
  isCustom: boolean;
}

interface ObjectPermissionsProps {
  objects: SalesforceObject[];
  selectedObject: string;
  onObjectChange: (objectName: string) => void;
  permissions: any;
  onPermissionsChange: (permissions: any) => void;
}

const ObjectPermissions: React.FC<ObjectPermissionsProps> = ({
  objects,
  selectedObject,
  onObjectChange,
  permissions,
  onPermissionsChange
}) => {
  const permissionTypes = [
    { key: 'read', label: 'Read', icon: Eye, description: 'View records' },
    { key: 'create', label: 'Create', icon: Plus, description: 'Create new records' },
    { key: 'edit', label: 'Edit', icon: Edit, description: 'Modify existing records' },
    { key: 'delete', label: 'Delete', icon: Trash2, description: 'Delete records' },
    { key: 'viewAll', label: 'View All', icon: Shield, description: 'View all records regardless of sharing' },
    { key: 'modifyAll', label: 'Modify All', icon: Shield, description: 'Modify all records regardless of sharing' }
  ];

  const handlePermissionChange = (permissionKey: string, value: boolean) => {
    onPermissionsChange({
      ...permissions,
      [permissionKey]: value
    });
  };

  const selectedObjectData = objects.find(obj => obj.name === selectedObject);

  return (
    <div className="space-y-6">
      {/* Object Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Select Object</label>
        <Select value={selectedObject} onValueChange={onObjectChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose an object to configure permissions..." />
          </SelectTrigger>
          <SelectContent>
            {objects.map((obj) => (
              <SelectItem key={obj.name} value={obj.name}>
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-gray-500" />
                  <span>{obj.label}</span>
                  {obj.isCustom && (
                    <Badge variant="outline" className="text-xs">Custom</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Object Info */}
      {selectedObjectData && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">{selectedObjectData.label}</h4>
                <p className="text-sm text-gray-600">{selectedObjectData.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    API Name: {selectedObjectData.name}
                  </Badge>
                  {selectedObjectData.isCustom && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                      Custom Object
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Grid */}
      {selectedObject && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Object Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionTypes.map((permType) => {
              const Icon = permType.icon;
              return (
                <Card
                  key={permType.key}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    permissions[permType.key] ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handlePermissionChange(permType.key, !permissions[permType.key])}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={permissions[permType.key] || false}
                        onCheckedChange={(checked) => handlePermissionChange(permType.key, !!checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Icon className={`h-4 w-4 ${permissions[permType.key] ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className="font-medium text-gray-900">{permType.label}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{permType.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!selectedObject && (
        <div className="text-center py-12 text-gray-500">
          <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Select an Object</p>
          <p className="text-sm">Choose an object from the dropdown to configure its permissions</p>
        </div>
      )}
    </div>
  );
};

export default ObjectPermissions;
