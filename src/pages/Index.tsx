
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Database, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import ProfileSelector from '@/components/ProfileSelector';
import ObjectPermissions from '@/components/ObjectPermissions';
import FieldPermissions from '@/components/FieldPermissions';
import PermissionPreview from '@/components/PermissionPreview';
import { salesforceService } from '@/services/salesforceService';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedObject, setSelectedObject] = useState<string>('');
  const [objectPermissions, setObjectPermissions] = useState<any>({});
  const [fieldPermissions, setFieldPermissions] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [objects, setObjects] = useState<any[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [profilesData, objectsData] = await Promise.all([
          salesforceService.getProfiles(),
          salesforceService.getObjects()
        ]);
        setProfiles(profilesData);
        setObjects(objectsData);
      } catch (error) {
        toast({
          title: "Error loading data",
          description: "Failed to load profiles and objects",
          variant: "destructive"
        });
      }
    };
    loadInitialData();
  }, []);

  const handleApplyPermissions = async () => {
    if (selectedProfiles.length === 0) {
      toast({
        title: "No profiles selected",
        description: "Please select at least one profile to apply permissions",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await salesforceService.applyBulkPermissions({
        profiles: selectedProfiles,
        objectPermissions,
        fieldPermissions,
        objectName: selectedObject
      });
      
      toast({
        title: "Permissions applied successfully",
        description: `Updated permissions for ${selectedProfiles.length} profile(s)`,
      });
      
      // Reset form
      setObjectPermissions({});
      setFieldPermissions({});
    } catch (error) {
      toast({
        title: "Error applying permissions",
        description: "Failed to update profile permissions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalChanges = () => {
    const objectChanges = Object.keys(objectPermissions).length;
    const fieldChanges = Object.keys(fieldPermissions).reduce((total, field) => {
      return total + Object.keys(fieldPermissions[field]).length;
    }, 0);
    return objectChanges + fieldChanges;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              Salesforce Permission Manager
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage object and field permissions for multiple profiles in bulk with our powerful administrative tool
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Selected Profiles</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedProfiles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Selected Object</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedObject ? '1' : '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Changes</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalChanges()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {isLoading ? 'Processing' : 'Ready'}
                  </p>
                </div>
                {isLoading ? (
                  <AlertCircle className="h-8 w-8 text-orange-500 animate-pulse" />
                ) : (
                  <Shield className="h-8 w-8 text-blue-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Selection */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Select Profiles
                </CardTitle>
                <CardDescription>
                  Choose which profiles to update with bulk permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileSelector
                  profiles={profiles}
                  selectedProfiles={selectedProfiles}
                  onSelectionChange={setSelectedProfiles}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Permissions Management */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-green-600" />
                  Permission Configuration
                </CardTitle>
                <CardDescription>
                  Configure object and field permissions to apply to selected profiles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="objects" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="objects">Object Permissions</TabsTrigger>
                    <TabsTrigger value="fields">Field Permissions</TabsTrigger>
                    <TabsTrigger value="preview">Preview Changes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="objects" className="mt-6">
                    <ObjectPermissions
                      objects={objects}
                      selectedObject={selectedObject}
                      onObjectChange={setSelectedObject}
                      permissions={objectPermissions}
                      onPermissionsChange={setObjectPermissions}
                    />
                  </TabsContent>

                  <TabsContent value="fields" className="mt-6">
                    <FieldPermissions
                      selectedObject={selectedObject}
                      permissions={fieldPermissions}
                      onPermissionsChange={setFieldPermissions}
                    />
                  </TabsContent>

                  <TabsContent value="preview" className="mt-6">
                    <PermissionPreview
                      selectedProfiles={selectedProfiles}
                      selectedObject={selectedObject}
                      objectPermissions={objectPermissions}
                      fieldPermissions={fieldPermissions}
                      profiles={profiles}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {selectedProfiles.length > 0 && (
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {selectedProfiles.length} profile(s) selected
                    </Badge>
                  )}
                  {getTotalChanges() > 0 && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {getTotalChanges()} change(s) pending
                    </Badge>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedProfiles([]);
                      setObjectPermissions({});
                      setFieldPermissions({});
                      setSelectedObject('');
                    }}
                    disabled={isLoading}
                  >
                    Reset All
                  </Button>
                  <Button
                    onClick={handleApplyPermissions}
                    disabled={isLoading || selectedProfiles.length === 0 || getTotalChanges() === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? 'Applying...' : 'Apply Permissions'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Alert */}
        <Alert className="mt-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Pro Tip:</strong> Always preview your changes before applying. Bulk permission changes affect multiple profiles simultaneously and should be reviewed carefully.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Index;
