import { LightningElement, track, wire } from 'lwc';
import getProfiles from '@salesforce/apex/ProfilePermissionService.getProfiles';
import getSObjects from '@salesforce/apex/ProfilePermissionService.getSObjects';
import updatePermissions from '@salesforce/apex/ProfilePermissionService.updatePermissions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PermissionManagerApp extends LightningElement {
    @track allProfiles = [];
    @track allSObjects = [];
    @track selectedProfiles = []; // List of profile IDs
    @track selectedObjectApiName = '';
    @track objectPermissions = {}; // { read: true, create: false, ... }
    @track fieldPermissions = {}; // { FieldApiName: { read: true, edit: false }, ... }
    
    @track isLoading = true;
    @track error = null;
    @track currentTab = 'objectPermissionsTab'; // Default active tab

    // --- Getters ---
    get selectedProfilesCount() {
        return this.selectedProfiles ? this.selectedProfiles.length : 0;
    }

    get selectedObjectCount() {
        return this.selectedObjectApiName ? 1 : 0;
    }

    get totalPendingChanges() {
        let changes = 0;
        if (this.objectPermissions) {
            changes += Object.values(this.objectPermissions).filter(val => typeof val === 'boolean').length;
        }
        if (this.fieldPermissions) {
            changes += Object.keys(this.fieldPermissions).length * 2; // Each field has read/edit
        }
        return changes;
    }

    get isApplyDisabled() {
        return this.isLoading || this.selectedProfiles.length === 0 || !this.selectedObjectApiName || this.totalPendingChanges === 0;
    }

    get isObjectEditorDisabled() {
        return this.selectedProfiles.length === 0;
    }

    get isFieldEditorDisabled() {
        return this.selectedProfiles.length === 0 || !this.selectedObjectApiName;
    }
    
    get allProfilesMap() {
        const map = new Map();
        this.allProfiles.forEach(profile => {
            map.set(profile.Id, profile);
        });
        return map;
    }

    get selectedProfilesBadgeLabel() {
        return `Profiles: ${this.selectedProfilesCount}`;
    }

    get pendingChangesBadgeLabel() {
        return `Changes: ${this.totalPendingChanges}`;
    }

    // --- Lifecycle Hooks ---
    connectedCallback() {
        this.loadInitialData();
    }

    // --- Data Loading ---
    async loadInitialData() {
        this.isLoading = true;
        this.error = null;
        try {
            const [profilesData, sObjectsData] = await Promise.all([
                getProfiles(),
                getSObjects()
            ]);
            this.allProfiles = profilesData.map(profile => ({ ...profile, label: profile.Name, value: profile.Id }));
            this.allSObjects = sObjectsData.map(sObject => ({ ...sObject, label: `${sObject.label} (${sObject.apiName})`, value: sObject.apiName }));
            this.showToast('Success', 'Initial data loaded successfully.', 'success');
        } catch (error) {
            this.error = error;
            this.showToast('Error loading data', this.getErrorMessage(error), 'error', 'sticky');
            console.error('Error loading initial data:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // --- Event Handlers ---
    handleProfileSelectionChange(event) {
        this.selectedProfiles = event.detail.selectedProfileIds;
        // If no profiles are selected, potentially reset object/field permissions
        if (this.selectedProfiles.length === 0) {
            this.resetObjectAndFieldPermissions();
        }
    }

    handleObjectChange(event) {
        this.selectedObjectApiName = event.detail.objectApiName;
        this.objectPermissions = event.detail.objectPermissions || {}; // Use existing or reset
        this.fieldPermissions = {}; // Reset field permissions when object changes
        
        // If child component clears the object, update accordingly
        if (!this.selectedObjectApiName) {
            this.objectPermissions = {};
        }
        // Potentially switch tab to object permissions if an object is selected
        if(this.selectedObjectApiName && this.currentTab !== 'objectPermissionsTab'){
            // this.currentTab = 'objectPermissionsTab'; // This might be too abrupt, consider user flow
        }
    }

    handleObjectPermissionsChange(event) {
        this.objectPermissions = { ...event.detail.permissions };
    }

    handleFieldPermissionsChange(event) {
        this.fieldPermissions = { ...event.detail.permissions };
    }

    handleTabActive(event) {
        this.currentTab = event.target.value;
    }
    
    resetObjectAndFieldPermissions() {
        this.selectedObjectApiName = '';
        this.objectPermissions = {};
        this.fieldPermissions = {};
        // Notify child components if they need to reset their internal state
        const objectEditor = this.template.querySelector('c-object-permission-editor-lwc');
        if (objectEditor) {
            objectEditor.reset(); 
        }
        const fieldEditor = this.template.querySelector('c-field-permission-editor-lwc');
        if (fieldEditor) {
            fieldEditor.reset();
        }
    }

    handleResetAll() {
        this.selectedProfiles = [];
        this.resetObjectAndFieldPermissions();
        
        const profileSelector = this.template.querySelector('c-profile-selector-lwc');
        if (profileSelector) {
            profileSelector.reset();
        }
        this.showToast('Reset', 'All selections and pending changes have been cleared.', 'info');
    }

    async handleApplyPermissions() {
        if (this.isApplyDisabled) {
            this.showToast('Cannot Apply', 'Please select profiles, an object, and make permission changes.', 'warning');
            return;
        }

        this.isLoading = true;
        this.error = null;

        const jsonData = JSON.stringify({
            profiles: this.selectedProfiles,
            objectName: this.selectedObjectApiName,
            objectPermissions: this.objectPermissions,
            fieldPermissions: this.fieldPermissions
        });

        try {
            const result = await updatePermissions({ jsonData });
            if (result && result.success) {
                this.showToast('Success!', `Permissions update deployment enqueued. Job ID: ${result.jobId}`, 'success', 'sticky');
                this.handleResetAll(); // Reset selections after successful application
            } else {
                throw new Error(result ? result.message : 'Unknown error during permission update.');
            }
        } catch (error) {
            this.error = error;
            this.showToast('Error Applying Permissions', this.getErrorMessage(error), 'error', 'sticky');
            console.error('Error applying permissions:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // --- Helper Methods ---
    showToast(title, message, variant, mode = 'dismissible') {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(event);
    }

    getErrorMessage(error) {
        if (error) {
            if (error.body && error.body.message) { // Apex error
                return error.body.message;
            }
            if (error.message) { // JS error
                return error.message;
            }
            return String(error);
        }
        return 'Unknown error';
    }
}
