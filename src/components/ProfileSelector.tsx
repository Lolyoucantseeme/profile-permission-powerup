
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, CheckCircle } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  userLicense: string;
  description: string;
  userCount: number;
}

interface ProfileSelectorProps {
  profiles: Profile[];
  selectedProfiles: string[];
  onSelectionChange: (profiles: string[]) => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  profiles,
  selectedProfiles,
  onSelectionChange
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.userLicense.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProfileToggle = (profileId: string) => {
    if (selectedProfiles.includes(profileId)) {
      onSelectionChange(selectedProfiles.filter(id => id !== profileId));
    } else {
      onSelectionChange([...selectedProfiles, profileId]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredProfiles.map(p => p.id);
    onSelectionChange(allFilteredIds);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={filteredProfiles.length === 0}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={selectedProfiles.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Selected Count */}
      {selectedProfiles.length > 0 && (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600 font-medium">
            {selectedProfiles.length} profile(s) selected
          </span>
        </div>
      )}

      {/* Profile List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredProfiles.map((profile) => (
          <div
            key={profile.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selectedProfiles.includes(profile.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleProfileToggle(profile.id)}
          >
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={selectedProfiles.includes(profile.id)}
                onChange={() => handleProfileToggle(profile.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {profile.name}
                  </h4>
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {profile.description}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {profile.userLicense}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {profile.userCount} users
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No profiles found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;
