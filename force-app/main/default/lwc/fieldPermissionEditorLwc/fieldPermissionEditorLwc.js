import { LightningElement, api, track, wire } from 'lwc';
import getSObjectFields from '@salesforce/apex/ProfilePermissionService.getSObjectFields'; // Corrected Apex method name

export default class FieldPermissionEditorLwc extends LightningElement {
    @api selectedObjectApiName = '';
    @api disabled = false; // True if no profiles selected or parent dictates

    _fieldPermissions = {}; // Internal store for { FieldApiName: { read: true, edit: false } }
    
    @api 
    get fieldPermissions() {
        return this._fieldPermissions;
    }
    set fieldPermissions(newPermissions) {
        this._fieldPermissions = newPermissions ? JSON.parse(JSON.stringify(newPermissions)) : {};
        // No need to re-render allFieldsForObject here, as filteredFields getter will use the new _fieldPermissions
    }

    @track allFieldsForObject = []; // Raw fields from Apex: { label, apiName, type, isCustom, isRequired }
    @track searchTerm = '';
    @track isLoadingFields = false;
    wiredFieldsData; // To store the wired data object

    @wire(getSObjectFields, { sObjectApiName: '$selectedObjectApiName' })
    wiredSObjectFields(result) {
        this.wiredFieldsData = result; // Store the raw result
        this.isLoadingFields = true;
        if (result.data) {
            // When object changes, fields are new. Reset related states.
            this.allFieldsForObject = result.data.map(field => ({
                ...field,
                // isRequired is already provided by Apex as per instructions
            }));
            this._fieldPermissions = {}; // Reset existing field permissions for the new object
            this.searchTerm = '';
            this.dispatchFieldPermissionsChangeEvent(); // Inform parent that permissions are cleared
            this.isLoadingFields = false;
        } else if (result.error) {
            console.error('Error loading fields for ' + this.selectedObjectApiName + ':', result.error);
            this.allFieldsForObject = [];
            this._fieldPermissions = {};
            this.searchTerm = '';
            this.dispatchFieldPermissionsChangeEvent();
            this.isLoadingFields = false;
            // Optionally, show a toast or error message to the user here
        } else if (this.selectedObjectApiName) { // Still loading
            this.isLoadingFields = true;
        } else { // No object selected
            this.allFieldsForObject = [];
            this._fieldPermissions = {};
            this.isLoadingFields = false;
        }
    }
    
    get hasSelectedObject() {
        return !!this.selectedObjectApiName;
    }

    get disabledOrLoading() {
        return this.disabled || this.isLoadingFields;
    }
    
    get disabledOrLoadingOrNoFilteredFields() {
        return this.disabled || this.isLoadingFields || !this.hasFilteredFields;
    }
    
    get disabledOrLoadingOrNoFilteredFieldsOrNoConfigured() {
        return this.disabled || this.isLoadingFields || !this.hasFilteredFields || this.configuredFieldsCount === 0;
    }

    get filteredFields() {
        if (!this.allFieldsForObject) return [];
        
        const searchLower = this.searchTerm.toLowerCase();
        const filtered = this.allFieldsForObject.filter(field =>
            !searchLower ||
            (field.label && field.label.toLowerCase().includes(searchLower)) ||
            (field.apiName && field.apiName.toLowerCase().includes(searchLower))
        );

        return filtered.map(field => {
            const perms = this._fieldPermissions[field.apiName] || { read: false, edit: false };
            return {
                ...field,
                permissions: perms
            };
        });
    }
    
    get hasFilteredFields() {
        return this.filteredFields && this.filteredFields.length > 0;
    }

    get configuredFieldsCount() {
        return Object.values(this._fieldPermissions).filter(p => p.read || p.edit).length;
    }
    
    get configuredFieldsBadge() {
        return `Configured Fields: ${this.configuredFieldsCount}`;
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    handleFieldPermissionChange(event) {
        const fieldApiName = event.target.dataset.fieldapiname;
        const permType = event.target.dataset.permtype; // 'read' or 'edit'
        const isChecked = event.target.checked;

        let newFieldPermissions = JSON.parse(JSON.stringify(this._fieldPermissions)); // Deep clone
        let currentFieldPerms = newFieldPermissions[fieldApiName] || { read: false, edit: false };

        currentFieldPerms[permType] = isChecked;

        if (permType === 'edit' && isChecked) {
            currentFieldPerms.read = true; // Edit implies Read
        }
        if (permType === 'read' && !isChecked) {
            currentFieldPerms.edit = false; // Unchecking Read unchecks Edit
        }
        
        // If both are false, we can remove the entry for this field to keep permissions clean
        if (!currentFieldPerms.read && !currentFieldPerms.edit) {
            delete newFieldPermissions[fieldApiName];
        } else {
            newFieldPermissions[fieldApiName] = currentFieldPerms;
        }

        this._fieldPermissions = newFieldPermissions;
        this.dispatchFieldPermissionsChangeEvent();
    }

    updatePermissionsForFilteredFields(readState, editState) {
        let newFieldPermissions = JSON.parse(JSON.stringify(this._fieldPermissions));
        this.filteredFields.forEach(field => {
            let currentFieldPerms = newFieldPermissions[field.apiName] || { read: false, edit: false };
            if (editState !== null) currentFieldPerms.edit = editState;
            if (readState !== null) currentFieldPerms.read = readState;

            // Cascade logic
            if (currentFieldPerms.edit) currentFieldPerms.read = true;
            if (!currentFieldPerms.read) currentFieldPerms.edit = false;

            if (!currentFieldPerms.read && !currentFieldPerms.edit) {
                delete newFieldPermissions[field.apiName];
            } else {
                 newFieldPermissions[field.apiName] = currentFieldPerms;
            }
        });
        this._fieldPermissions = newFieldPermissions;
        this.dispatchFieldPermissionsChangeEvent();
    }

    handleBulkGrantReadAllFiltered() {
        this.updatePermissionsForFilteredFields(true, null); // Grant Read, leave Edit as is (but apply cascade)
    }

    handleBulkGrantEditAllFiltered() {
        this.updatePermissionsForFilteredFields(true, true); // Grant Edit (and Read)
    }

    handleBulkClearAllFiltered() {
         let newFieldPermissions = JSON.parse(JSON.stringify(this._fieldPermissions));
        this.filteredFields.forEach(field => {
            // Only clear those that are in the filtered list
            if (newFieldPermissions[field.apiName]) {
                delete newFieldPermissions[field.apiName];
            }
        });
        this._fieldPermissions = newFieldPermissions;
        this.dispatchFieldPermissionsChangeEvent();
    }

    dispatchFieldPermissionsChangeEvent() {
        this.dispatchEvent(new CustomEvent('fieldpermissionschange', {
            detail: { permissions: JSON.parse(JSON.stringify(this._fieldPermissions)) } // Send a clone
        }));
    }

    @api
    reset() {
        // This is called by parent when object changes or global reset
        // The wire service handles resetting fields when selectedObjectApiName changes.
        // So, mainly ensure _fieldPermissions and searchTerm are cleared.
        this.searchTerm = '';
        this._fieldPermissions = {};
        // No need to dispatch here as parent is initiating reset or object change is handling it.
    }
}
