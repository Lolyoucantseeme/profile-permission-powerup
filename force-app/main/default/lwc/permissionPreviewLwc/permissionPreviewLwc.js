import { LightningElement, api } from 'lwc';

const OBJECT_PERMISSION_DEFINITIONS = {
    read: { label: 'Read', iconName: 'utility:preview', key: 'read' },
    create: { label: 'Create', iconName: 'utility:add', key: 'create' },
    edit: { label: 'Edit', iconName: 'utility:edit', key: 'edit' },
    delete: { label: 'Delete', iconName: 'utility:delete', key: 'delete' },
    viewAll: { label: 'View All Records', iconName: 'utility:table', key: 'viewAll' },
    modifyAll: { label: 'Modify All Records', iconName: 'utility:lock', key: 'modifyAll' }
};

export default class PermissionPreviewLwc extends LightningElement {
    // Parent component (permissionManagerApp) provides allProfilesMap directly
    @api allProfilesMap = new Map(); 
    @api selectedProfiles = []; // List of profile IDs
    @api selectedObjectApiName = '';
    @api objectPermissions = {}; // { read: true, create: false, ... }
    @api fieldPermissions = {}; // { FieldApiName: { read: true, edit: false }, ... }
    @api disabled = false; // Not directly used here but good for consistency

    get selectedProfileDetails() {
        if (!this.selectedProfiles || this.selectedProfiles.length === 0 || !this.allProfilesMap || this.allProfilesMap.size === 0) {
            return [];
        }
        return this.selectedProfiles.map(profileId => {
            const profile = this.allProfilesMap.get(profileId);
            return profile ? { Id: profileId, Name: profile.Name } : { Id: profileId, Name: 'Unknown Profile' };
        }).sort((a, b) => a.Name.localeCompare(b.Name));
    }

    get activeObjectPermissions() {
        if (!this.objectPermissions) return [];
        return Object.keys(this.objectPermissions)
            .filter(key => this.objectPermissions[key] === true && OBJECT_PERMISSION_DEFINITIONS[key])
            .map(key => ({
                key: OBJECT_PERMISSION_DEFINITIONS[key].key,
                label: OBJECT_PERMISSION_DEFINITIONS[key].label,
                iconName: OBJECT_PERMISSION_DEFINITIONS[key].iconName
            }));
    }

    get activeObjectPermissionsCount() {
        return this.activeObjectPermissions.length;
    }

    get hasActiveObjectPermissions() {
        return this.activeObjectPermissionsCount > 0;
    }
    
    get activeFieldPermissionsList() {
        if (!this.fieldPermissions) return [];
        return Object.keys(this.fieldPermissions)
            .filter(fieldName => this.fieldPermissions[fieldName] && (this.fieldPermissions[fieldName].read || this.fieldPermissions[fieldName].edit))
            .map(fieldName => ({
                fieldName: fieldName,
                read: this.fieldPermissions[fieldName].read || false,
                edit: this.fieldPermissions[fieldName].edit || false
            }))
            .sort((a,b) => a.fieldName.localeCompare(b.fieldName));
    }

    get activeFieldPermissionsCount() {
        return this.activeFieldPermissionsList.length;
    }

    get hasActiveFieldPermissions() {
        return this.activeFieldPermissionsCount > 0;
    }

    get totalChanges() {
        return this.activeObjectPermissionsCount + this.activeFieldPermissionsCount;
    }

    get showNoProfilesMessage() {
        return !this.selectedProfiles || this.selectedProfiles.length === 0;
    }

    get showNoObjectMessage() {
        return !this.showNoProfilesMessage && !this.selectedObjectApiName;
    }

    get showNoChangesMessage() {
        return !this.showNoProfilesMessage && !this.showNoObjectMessage && this.totalChanges === 0;
    }

    get showPreview() {
        return !this.showNoProfilesMessage && !this.showNoObjectMessage && !this.showNoChangesMessage;
    }

    @api
    reset() {
        // This component is display-only based on props, so no internal state to reset that affects display logic directly.
        // Parent component will clear the props which will re-trigger getters.
    }
}
