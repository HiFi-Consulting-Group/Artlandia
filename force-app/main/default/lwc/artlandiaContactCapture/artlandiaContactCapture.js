import { LightningElement , api} from 'lwc';
import addContactDetails from '@salesforce/apex/ArtlandiaController.addContactDetails';
import { NavigationMixin } from "lightning/navigation";

export default class ArtlandiaContactCapture extends NavigationMixin(LightningElement) {
    artReportId;
    inputs =[];
    firstName;
    lastName;
    email;
    committeeInterest = false;

    handleInterest(event) {
        this.committeeInterest = event.target.checked;
        console.log('this.committeeInterest',this.committeeInterest);
    }
    handleFirst(event) {
        this.firstName = event.target.value;
        console.log('this.firstName',this.firstName);
    }
    handleLast(event) {
        this.lastName = event.target.value;
    }
    handleEmail(event) {
        this.email = event.target.value;
    }

    get submitDisabled() {
        let email = this.template.querySelector('.email-input');

        if (this.firstName && this.lastName && this.email && email.validity.valid === true) {
            return false;
        } else {
            return true;
        }
    }

    async handleSubmit() {

        await addContactDetails({artReportId:this.artReportId, firstName:this.firstName, lastName:this.lastName, email:this.email,joinCommittee:this.committeeInterest});
        
        this.template.querySelector('[data-id="thankYouModal"]').show();
    }

    handleReturnToStart() {
        eval("$A.get('e.force:refreshView').fire();");
    }

    handleReturnToArtlandiaSite() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: 'http://forcelandia.com/'
            }
        });
    }

    @api setartReportId(siteId) {
        this.artReportId = siteId;
    }

    get thankYouContent() {
        return '<p>THANK YOU!</p><br><p>We hope to see you at an Artlandia event soon, maybe for a new event at this location!</p>';
    }
    
}