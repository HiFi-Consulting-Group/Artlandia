import { LightningElement } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

export default class Artlandia extends NavigationMixin(LightningElement) {
    showArtCapture = false;  //temp, set to false
    showContactCapture = false;
    loadComplete = false;
    visitorIpAddress;

    connectedCallback () {
        // Sets the theme color to extend into phone screen header
        let metaColorSetting = document.createElement("meta");
        metaColorSetting.setAttribute("name", "theme-color");
        metaColorSetting.setAttribute("content", "#499ee9");
        document.getElementsByTagName('head')[0].appendChild(metaColorSetting);

        let metaViewportSetting = document.createElement("meta");
        metaViewportSetting.setAttribute("name", "viewport");
        metaViewportSetting.setAttribute("content", "user-scalable=no, width=device-width, initial-scale=1.0");
        document.getElementsByTagName('head')[0].appendChild(metaViewportSetting);
    }

    renderedCallback() {
        if (!this.loadComplete) {
            this.loadComplete = true;
            this.checkIfConsentNeeded();
        }
    }

    checkIfConsentNeeded() {
        console.log('checkIfConsentNeeded');
        // Callout to get the ip (can't use built in LWC ip getter with anonymous guest users)
        var request = new XMLHttpRequest();
        request.open('GET', "https://api.ipify.org?format=jsonp=", true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                let ipAddress = request.responseText;
                this.visitorIpAddress= ipAddress;
                if (ipAddress===localStorage.getItem('solveConsentGivenIp')) {
                    this.handleYesConsent(); //already gave consent if their ip address is in the localStorageSetting
                } else {
                    this.template.querySelector('[data-id="consentModal"]').show();
                }
            } else {
                // We reached our target server, but it returned an error
                console.log('error on ip request',request.statusText);
            }
        }.bind(this); //bind this context so that the anonymous function can access it

        request.onerror = function () {
            // There was a connection error of some sort
            console.log(request.statusText);
        }
        request.send();
    }

    handleArtCaptured(event) {
        console.log('handleReportCreated');
        let reportId = event.detail.reportId;
        console.log('event.detail.reportId',event.detail.reportId);
    
        // Crop for display
        this.switchToContactCapture(this)
        .then(result => {
            console.log('now set site id on contact capture',reportId);
            this.template.querySelector('c-artlandia-contact-capture').setartReportId(reportId);
        }) 
        .catch(error => {
            console.log('error',error);
        });

    }

    switchToContactCapture() {
        return new Promise((resolve, reject) => {
            console.log('switchToContactCapture');
            this.showArtCapture = false;
            this.showContactCapture = true;
            resolve();
        });
        
    }

    handleReportCreated (event) {
        console.log('handleReportCreated');
        let reportId = event.detail.reportId;
        console.log('event.detail.reportId',event.detail.reportId);
        this.template.querySelector('c-artlandia-contact-capture').setartReportId(reportId);
    }

    get consentContent() {
        return '<p><strong>Artlandia uses your phone’s camera and GPS location to share data directly with Artlandia for weird artfinding purposes. It does NOT track activity or data beyond what you choose to share in the app. </p><br><p>Please see our privacy policy for more details, including our use of cookies and personal contact information. </strong></p>';
    }

    handleYesConsent() {
        // Store the ip address so we don't ask for consent again
        localStorage.setItem('artlandiaConsentGivenIp', this.visitorIpAddress);
        this.template.querySelector('[data-id="consentModal"]').hide();
        this.showArtCapture = true;
        console.log('show site capture');
    }

    handleNoConsent() {
        const sendToArtlandia = {
            type: 'standard__webPage',
            attributes: {
                url: 'http://forcelandia.com'
            }
        };
        this[NavigationMixin.Navigate](sendToArtlandia);
          
    }
}