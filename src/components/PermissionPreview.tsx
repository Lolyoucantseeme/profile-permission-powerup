
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Edit, Plus, Trash2, Shield, Users, Database, Type, AlertTriangle } from 'lucide-react';

interface PermissionPreviewProps {
  selectedProfiles: string[];
  selectedObject: string;
  objectPermissions: any;
  fieldPermissions: any;
  profiles: any[];
}

const PermissionPreview: React.FC<PermissionPreviewProps> = ({
  selectedProfiles,
  selectedObject,
  objectPermissions,
  fieldPermissions,
  profiles
}) => {
  const selectedProfileData = profiles.filter(p => selectedProfiles.includes(p.id));
  
  const objectPermissionIcons = {
    read: Eye,
    create: Plus,
    edit: Edit,
    delete: Trash2,
    viewAll: Shield,
    modifyAll: Shield
  };

  const objectPermissionLabels = {
    read: 'Read',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    viewAll: 'View All',
    modifyAll: 'Modify All'
  };

  const getActiveObjectPermissions = () => {
    return Object.keys(objectPermissions).filter(key => objectPermissions[key]);
  };

  const getActiveFieldPermissions = () => {
    const activeFields = [];
    Object.keys(fieldPermissions).forEach(fieldName => {
      const perms = fieldPermissions[fieldName];
      if (perms.read || perms.edit) {
        activeFields.push({
          name: fieldName,
          read: perms.read,
          edit: perms.edit
        });
      }
    });
    return activeFields;
  };

  const getTotalChanges = () => {
    const objectChanges = getActiveObjectPermissions().length;
    const fieldChanges = getActiveFieldPermissions().length;
    return objectChanges + fieldChanges;
  };

  if (selectedProfiles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No Profiles Selected</p>
        <p className="text-sm">Select profiles to preview permission changes</p>
      </div>
    );
  }

  if (!selectedObject) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No Object Selected</p>
        <p className="text-sm">Select an object to preview permission changes</p>
      </div>
    );
  }

  if (getTotalChanges() === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-orange-300" />
        <p className="text-lg font-medium">No Changes Configured</p>
        <p className="text-sm">Configure object or field permissions to see preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Shield className="h-5 w-5 mr-2" />
            Permission Change Summary
          </CardTitle>
          <CardDescription className="text-blue-700">
            Review the permissions that will be applied to selected profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{selectedProfiles.length}</div>
              <div className="text-sm text-blue-700">Profile(s)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-900">{getActiveObjectPermissions().length}</div>
              <div className="text-sm text-green-700">Object Permission(s)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">{getActiveFieldPermissions().length}</div>
              <div className="text-sm text-purple-700">Field Permission(s)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Affected Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedProfileData.map(profile => (
              <Badge key={profile.id} variant="outline" className="text-sm">
                {profile.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Object Permissions */}
      {getActiveObjectPermissions().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-green-600" />
              Object Permissions: {selectedObject}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getActiveObjectPermissions().map(permission => {
                const Icon = objectPermissionIcons[permission as keyof typeof objectPermissionIcons];
                return (
                  <div key={permission} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                    <Icon className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {objectPermissionLabels[permission as keyof typeof objectPermissionLabels]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Permissions */}
      {getActiveFieldPermissions().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Type className="h-5 w-5 mr-2 text-purple-600" />
              Field Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getActiveFieldPermissions().map(field => (
                <div key={field.name} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Type className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-900">{field.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    {field.read && (
                      <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                        <Eye className="h-3 w-3 mr-1" />
                        Read
                      </Badge>
                    )}
                    {field.edit && (
                      <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important Notice</p>
              <p>
                These permission changes will be applied to <strong>{selectedProfiles.length} profile(s)</strong> and 
                may affect multiple users. Please review carefully before applying changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionPreview;
