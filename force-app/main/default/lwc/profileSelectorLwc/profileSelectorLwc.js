import { LightningElement, api, track } from 'lwc';

export default class ProfileSelectorLwc extends LightningElement {
    _allProfiles = [];
    @track _selectedProfileIds = []; // Internal tracking

    @api 
    get allProfiles() {
        return this._allProfiles;
    }
    set allProfiles(data = []) {
        // When new profiles are loaded, we need to preserve existing selections if those profiles still exist
        // And potentially add a 'LicenseName' if it's nested, and 'isSelected' property
        this._allProfiles = data.map(p => ({
            ...p,
            LicenseName: p.License ? p.License.Name : 'N/A', // Handle cases where License might be null
            isSelected: this._selectedProfileIds.includes(p.Id) 
        }));
    }

    // Allow parent to set selected IDs, e.g., when resetting all in parent
    @api 
    get selectedProfileIds() {
        return this._selectedProfileIds;
    }
    set selectedProfileIds(value = []) {
        this._selectedProfileIds = [...value];
        // Update isSelected status on profiles when parent changes selection
        this._allProfiles = this._allProfiles.map(p => ({
            ...p,
            isSelected: this._selectedProfileIds.includes(p.Id)
        }));
    }
    
    @track searchTerm = '';

    get filteredProfiles() {
        const searchLower = this.searchTerm.toLowerCase();
        if (!searchLower) {
            return this._allProfiles.map(p => ({...p, isSelected: this._selectedProfileIds.includes(p.Id)}));
        }
        return this._allProfiles.filter(profile =>
            (profile.Name && profile.Name.toLowerCase().includes(searchLower)) ||
            (profile.LicenseName && profile.LicenseName.toLowerCase().includes(searchLower))
        ).map(p => ({...p, isSelected: this._selectedProfileIds.includes(p.Id)}));
    }

    get hasFilteredProfiles() {
        return this.filteredProfiles.length > 0;
    }
    
    get isNoProfilesFound() {
        return this.filteredProfiles.length === 0;
    }

    get isNoProfilesSelected() {
        return this._selectedProfileIds.length === 0;
    }

    get selectedProfilesBadge() {
        const count = this._selectedProfileIds.length;
        return `${count} profile${count === 1 ? '' : 's'} selected`;
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    handleProfileToggle(event) {
        const profileId = event.target.value;
        const isSelected = event.target.checked;

        if (isSelected) {
            if (!this._selectedProfileIds.includes(profileId)) {
                this._selectedProfileIds = [...this._selectedProfileIds, profileId];
            }
        } else {
            this._selectedProfileIds = this._selectedProfileIds.filter(id => id !== profileId);
        }
        // Update the isSelected property for the specific profile in allProfiles for checkbox binding
        this._allProfiles = this._allProfiles.map(p => 
            p.Id === profileId ? {...p, isSelected: isSelected} : p
        );
        this.dispatchSelectionChangeEvent();
    }

    handleSelectAllFiltered() {
        const filteredIds = this.filteredProfiles.map(profile => profile.Id);
        this._selectedProfileIds = [...new Set([...this._selectedProfileIds, ...filteredIds])];
         // Update isSelected for all filtered profiles
        this._allProfiles = this._allProfiles.map(p => 
            filteredIds.includes(p.Id) ? {...p, isSelected: true} : p
        );
        this.dispatchSelectionChangeEvent();
    }

    handleClearAllSelected() {
        this._selectedProfileIds = [];
        // Update isSelected for all profiles
        this._allProfiles = this._allProfiles.map(p => ({...p, isSelected: false}));
        this.dispatchSelectionChangeEvent();
    }

    dispatchSelectionChangeEvent() {
        const selectionChangedEvent = new CustomEvent('profileselectionchange', { // Changed event name
            detail: { selectedProfileIds: [...this._selectedProfileIds] }
        });
        this.dispatchEvent(selectionChangedEvent);
    }

    @api
    reset() {
        this.searchTerm = '';
        this._selectedProfileIds = [];
        this._allProfiles = this._allProfiles.map(p => ({ ...p, isSelected: false }));
        // No need to dispatch event here as parent is initiating reset
    }
}
