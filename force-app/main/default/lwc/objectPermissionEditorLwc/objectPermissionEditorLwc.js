import { LightningElement, api, track } from 'lwc';

const INITIAL_OBJECT_PERMISSIONS = {
    read: false,
    create: false,
    edit: false,
    delete: false,
    viewAll: false,
    modifyAll: false
};

export default class ObjectPermissionEditorLwc extends LightningElement {
    @api allSObjects = [];
    @api selectedObjectApiName = '';
    // objectPermissions is managed by the parent. This component receives it.
    // When a permission changes here, it informs the parent.
    @api objectPermissions = { ...INITIAL_OBJECT_PERMISSIONS }; 
    @api disabled = false; // Controlled by parent based on profile selection

    _sObjectOptions = [];

    // Keep a local copy for immediate UI updates and to compare with incoming props
    @track currentObjectPermissions = { ...INITIAL_OBJECT_PERMISSIONS };

    connectedCallback() {
        this.deriveSObjectOptions();
        this.currentObjectPermissions = { ...this.objectPermissions };
    }
    
    // When API properties change, update internal state
    @api 
    setSObjects(data) { // Renamed to avoid conflict with allSObjects getter/setter if we had one
        this.allSObjects = data || [];
        this.deriveSObjectOptions();
    }
    
    @api 
    setSelectedSObject(apiName) {
        this.selectedObjectApiName = apiName || '';
         // If the object is cleared, reset permissions
        if (!this.selectedObjectApiName) {
            this.currentObjectPermissions = { ...INITIAL_OBJECT_PERMISSIONS };
            // Parent will also clear its own objectPermissions, so no need to dispatch here
        }
    }

    @api
    setPermissions(newPermissions) {
        if (newPermissions && Object.keys(newPermissions).length > 0) {
            this.currentObjectPermissions = { ...INITIAL_OBJECT_PERMISSIONS, ...newPermissions };
        } else {
            this.currentObjectPermissions = { ...INITIAL_OBJECT_PERMISSIONS };
        }
    }


    deriveSObjectOptions() {
        if (this.allSObjects && this.allSObjects.length > 0) {
            this._sObjectOptions = this.allSObjects.map(sObject => ({
                label: sObject.label, // Parent already formats this as "Label (APIName)"
                value: sObject.apiName // Parent passes apiName as value
            }));
        } else {
            this._sObjectOptions = [];
        }
    }
    
    get sObjectOptions() {
        if (this._sObjectOptions && this._sObjectOptions.length > 0) return this._sObjectOptions;
        if (this.allSObjects && this.allSObjects.length > 0) {
             this.deriveSObjectOptions(); // Recalculate if not already done
             return this._sObjectOptions;
        }
        return [];
    }
    
    get selectedObjectDetails() {
        if (!this.selectedObjectApiName || !this.allSObjects) {
            return null;
        }
        return this.allSObjects.find(sObj => sObj.apiName === this.selectedObjectApiName);
    }

    get isObjectSelected() {
        return !!this.selectedObjectApiName;
    }

    handleObjectSelection(event) {
        const newApiName = event.detail.value;
        // this.selectedObjectApiName = newApiName; // Parent will update this via property binding

        // When object changes, new default permissions should apply.
        // The parent component is responsible for resetting field permissions.
        // Dispatch event for parent to handle the change and reset permissions.
        this.dispatchEvent(new CustomEvent('objectchange', {
            detail: { 
                objectApiName: newApiName,
                // Send initial/default permissions for the new object
                objectPermissions: { ...INITIAL_OBJECT_PERMISSIONS } 
            }
        }));
    }

    handlePermissionChange(event) {
        const permissionName = event.target.dataset.perm; // e.g., 'read', 'create'
        const isChecked = event.target.checked;

        const newPermissions = {
            ...this.currentObjectPermissions,
            [permissionName]: isChecked
        };
        this.currentObjectPermissions = newPermissions; // Update local state for UI

        this.dispatchEvent(new CustomEvent('objectpermissionschange', {
            detail: { permissions: newPermissions }
        }));
    }
    
    @api
    reset() {
        // this.selectedObjectApiName = ''; // Parent controls this
        this.currentObjectPermissions = { ...INITIAL_OBJECT_PERMISSIONS };
        // No need to dispatch event as parent is initiating the reset
    }

    // Lifecycle hook to react to changes from parent
    renderedCallback() {
        // If parent changes objectPermissions, reflect it
        if (JSON.stringify(this.currentObjectPermissions) !== JSON.stringify(this.objectPermissions)) {
             if (this.objectPermissions && Object.keys(this.objectPermissions).length > 0) {
                this.currentObjectPermissions = { ...INITIAL_OBJECT_PERMISSIONS, ...this.objectPermissions };
            } else if (!this.selectedObjectApiName) { // If parent clears object, permissions should clear too
                 this.currentObjectPermissions = { ...INITIAL_OBJECT_PERMISSIONS };
            }
        }
         // If parent clears selectedObjectApiName, ensure UI reflects no selection
        if (!this.selectedObjectApiName && this.isObjectSelected) {
             // This case should ideally be handled by parent setting objectPermissions to empty/initial
             // and selectedObjectApiName to null/empty.
        }
    }
}
