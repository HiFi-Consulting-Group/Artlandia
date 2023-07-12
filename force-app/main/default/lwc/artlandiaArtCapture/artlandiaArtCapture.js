import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

import createArtReport from '@salesforce/apex/ArtlandiaController.createArtReport';
import addPhotoToArtReport from '@salesforce/apex/ArtlandiaController.addPhotoToArtReport';
import artlandiaResources from '@salesforce/resourceUrl/artlandiaResources';

export default class ArtlandiaArtCapture extends NavigationMixin(LightningElement) {
    solveLogo = artlandiaResources + '/artlandiaResources/Forcelandia-logo.png';
    violetMapMarker = artlandiaResources + '/artlandiaResources/marker-icon-2x-violet.png';
    mapMarkerShadow = artlandiaResources + '/artlandiaResources/marker-shadow.png';

    @api visitorIpAddress;

    mapInitialized = false;
    showInstructions = true;

    allowedUploadFormats;

    hasPhoto1 = false;
    hasPhoto2 = false;
    hasPhoto3 = false;
    allPhotoSlotsFull = false;

    photo1Base64;
    photo1Resized;
    photo2Resized;
    photo3Resized;

    artReportId;
    showSpinner = false;
    showPhotoSpinner = false;
    initalRenderComplete = false;

    connectedCallback() {
        let options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        //Pull up the current location in the map
        if (!this.mapInitialized) {
            this.mapInitialized = true;
            navigator.geolocation.getCurrentPosition(this.locationSuccess.bind(this),this.locationError.bind(this),options);
        } 

        this.checkIfInstructionsViewed();
           
    }

    checkIfInstructionsViewed() {

        let instructionsViewed = localStorage.getItem('solveInstructionsViewed');
        if (instructionsViewed) {
            this.showInstructions = false;
        } else {
            localStorage.setItem('solveInstructionsViewed', this.visitorIpAddress);
        }
    }

    handleStartOver() {
        this.template.querySelector('[data-id="startOverModal"]').show();
    }

    hideStartOver() {
        this.template.querySelector('[data-id="startOverModal"]').hide();
    }

    finishStartOver() {
        eval("$A.get('e.force:refreshView').fire();");
    }

    hideHowUseModal() {
        this.template.querySelector('[data-id="howUseModal"]').hide();
    }

    renderedCallback() {
        if (!this.initalRenderComplete){
            this.initalRenderComplete = true;
            if (this.showInstructions) {
                this.template.querySelector('[data-id="howUseModal"]').show();
            }
        }

        let cameraIcon = this.template.querySelector('[data-name="cameraIcon"]');
        let photo1Slot =  this.template.querySelector('[data-id="photo1"]');
        let photo2Slot =  this.template.querySelector('[data-id="photo2"]');
        let photo3Slot =  this.template.querySelector('[data-id="photo3"]');

        let measure = cameraIcon.offsetHeight * 1.6;
        photo1Slot.style.height = measure + 'px';
        photo1Slot.style.width = measure + 'px';
        photo2Slot.style.height = measure + 'px';
        photo2Slot.style.width = measure + 'px';
        photo3Slot.style.height = measure + 'px';
        photo3Slot.style.width = measure + 'px';

        let activeFrames = this.template.querySelectorAll(".active-photo-frame");
        activeFrames.forEach((frame) => {
            frame.style.height = measure + 'px';
            frame.style.width = measure + 'px';
        });

        let disabledFrames = this.template.querySelectorAll(".disabled-photo-frame");
        disabledFrames.forEach((frame) => {
            frame.style.height = measure + 'px';
            frame.style.width = measure + 'px';
        });

        this.updatePhotoSlotStyles();

    }


    // Callbacks for map
    locationError(err) {
        console.log('map error',err);
        console.warn(`ERROR(${err.code}): ${err.message}`);

        // Set default location to Pioneer Square
        this.initializeMap(45.51879972683631,-122.67844923810331);
    }

    locationSuccess(pos) {
        var crd = pos.coords;
        this.initializeMap(crd.latitude,crd.longitude);
    }

    initializeMap(mapLatitude, mapLongitude) {
        this.template.querySelector('c-leaflet-map-f-s-c').latitude = mapLatitude;
        this.template.querySelector('c-leaflet-map-f-s-c').longitude = mapLongitude;

        // Use a custom violet map marker
        this.template.querySelector('c-leaflet-map-f-s-c').customMapMarker = this.violetMapMarker;
        this.template.querySelector('c-leaflet-map-f-s-c').customMapMarkerShadow = this.mapMarkerShadow;

        this.template.querySelector('c-leaflet-map-f-s-c').initMap();
    }

    get submitDisabled() {
        if (this.hasPhoto1) {
            return false;
        } else {
            return true;
        }
    }

    handleCameraClick() {
        // If all slots are full, this function is disabled
        if (this.allPhotoSlotsFull) {
            return;
        }

        this.template.querySelector('[data-id="photoInput"]').click();
    }

    async handlePhotoUpload() {

        this.showPhotoSpinner = true;
        let incomingFile = this.template.querySelector('input');
        if (incomingFile.files.length>0) {
            
            let reader = new FileReader();
            reader.onloadend = function() {
                
                let photo2Slot =  this.template.querySelector('[data-id="photo2"]');
                let photo3Slot =  this.template.querySelector('[data-id="photo3"]');
                let photo1Slot =  this.template.querySelector('[data-id="photo1"]');

                if (!this.hasPhoto1) {
                    this.hasPhoto1 = true;

                    // Unhide the img slot
                    let photoDiv =  this.template.querySelector('[data-id="photo1EnclosingDiv"]');
                    photoDiv.classList.remove("hide");

                    // Crop for display
                    this.cropImage(reader.result,1,this)
                        .then(result => {
                            photo1Slot.setAttribute("src", result.toDataURL());
                        }) 
                        .catch(error => {
                            console.log('error',error);
                        });

                    // Resize
                    this.resizeImage(reader.result,this)
                        .then(result => {
                            console.log('imgDataURL',result);
                            this.photo1Resized = result;
                        }) 
                        .catch(error => {
                            console.log('error',error);
                        });
                } else if (!this.hasPhoto2) {
                    // If there is no photo1, but there is a photo one, style as available
                    photo2Slot.setAttribute("src", reader.result);
                    this.hasPhoto2 = true;

                    // style the third slot as active
                    let photoFrame3 = this.template.querySelector('[data-id="photoFrame3"]');
                    photoFrame3.classList.remove("disabled-photo-frame","solve-photo-text-disabled");
                    photoFrame3.classList.add("active-photo-frame","solve-photo-text-enabled");

                    // Unhide the img slot
                    let photoDiv =  this.template.querySelector('[data-id="photo2EnclosingDiv"]');
                    photoDiv.classList.remove("hide");

                    // Crop for display
                    this.cropImage(reader.result,1,this)
                        .then(result => {
                            photo2Slot.setAttribute("src", result.toDataURL());
                        }) 
                        .catch(error => {
                            console.log('error',error);
                        });

                    this.resizeImage(reader.result,this)
                        .then(result => {
                            console.log('imgDataURL',result);
                            this.photo2Resized = result;
                        }) 
                        .catch(error => {
                            console.log('error',error);
                        });
                } else {
                    this.hasPhoto3 = true;
                    this.allPhotoSlotsFull = true;
                    this.markCameraIconDisabled();

                    // Unhide the img slot
                    let photoDiv =  this.template.querySelector('[data-id="photo3EnclosingDiv"]');
                    photoDiv.classList.remove("hide");

                    // Crop for display
                    this.cropImage(reader.result,1,this)
                        .then(result => {
                            photo3Slot.setAttribute("src", result.toDataURL());
                        }) 
                        .catch(error => {
                            console.log('error',error);
                        });
                    
                    // Resize for storage
                    this.resizeImage(reader.result,this)
                        .then(result => {
                            console.log('imgDataURL',result);
                            this.photo3Resized = result;
                        }) 
                        .catch(error => {
                            console.log('error',error);
                        });
                }
            }.bind(this);
            reader.readAsDataURL(incomingFile.files[0]);
        }
        this.showPhotoSpinner = false;
    }

    togglePhotoTips() {
        this.template.querySelector('[data-id="photoHelpModal"]').toggle();
    }

    async handleSubmit(event) {
        this.showSpinner = true;
        let base64Photo1;
        let base64Photo2;
        let base64Photo3;

        if (this.photo1Resized) {
            base64Photo1 = this.photo1Resized.split(';base64,')[1];
        }
        if (this.photo2Resized) {
            base64Photo2 = this.photo2Resized.split(';base64,')[1];
        }
        if (this.photo3Resized) {
            base64Photo3 = this.photo3Resized.split(';base64,')[1];
        }

        let lat = this.template.querySelector('c-leaflet-map-f-s-c').latitude;
        let lng = this.template.querySelector('c-leaflet-map-f-s-c').longitude;
        let comments = this.template.querySelector('[data-name="comments"]').value;

        try {
            let artReport = JSON.parse(await createArtReport({lat:lat, lng:lng, comments:comments}));
            this.artReportId = artReport.Id;

            await Promise.all ([
                addPhotoToArtReport ({fileName:"Site Photo 1", base64Data:base64Photo1, artReportId:this.artReportId}),
                addPhotoToArtReport ({fileName:"Site Photo 2", base64Data:base64Photo2, artReportId:this.artReportId}),
                addPhotoToArtReport ({fileName:"Site Photo 3", base64Data:base64Photo3, artReportId:this.artReportId}),
            ]);

            this.showSpinner = false;
            this.template.querySelector('[data-id="thankYouModal"]').show();
            

        } catch (error) {
            console.log('error',error);
        }

    }

    handleContinue() {
        this.dispatchEvent(new CustomEvent('sitecaptured', { 
            detail: {
                reportId: this.artReportId
            }
        }));
    }

    handlePhotoRemove(event) {

        let button = event.target.name;
        let photoSlot;
        if (button==='photo1Remove') {
            photoSlot = this.template.querySelector('[data-id="photo1"]');
            this.hasPhoto1 = false;

            let photoDiv =  this.template.querySelector('[data-id="photo1EnclosingDiv"]');
            photoDiv.classList.add("hide");

        } else if (button==='photo2Remove') {
            photoSlot = this.template.querySelector('[data-id="photo2"]');
            this.hasPhoto2 = false;

            let photoDiv =  this.template.querySelector('[data-id="photo2EnclosingDiv"]');
            photoDiv.classList.add("hide");

        } else if (button==='photo3Remove') {
            photoSlot = this.template.querySelector('[data-id="photo3"]');
            this.hasPhoto3 = false;
            this.allPhotoSlotsFull = false;
            this.markCameraIconActive();

            let photoDiv =  this.template.querySelector('[data-id="photo3EnclosingDiv"]');
            photoDiv.classList.add("hide");
        }

        photoSlot.setAttribute("src", null);
        this.reorderPhotos();

    }

    updatePhotoSlotStyles() {
        if (!this.hasPhoto1) {
            this.markPhoto2SlotInactive();
        } else if (this.hasPhoto1 && !this.hasPhoto2) {
            this.markPhoto2SlotActive();
            this.markPhoto3SlotInactive();
        } else if (this.hasPhoto2 && !this.hasPhoto3) {
            this.markPhoto3SlotActive();
        } 
    }

    markPhoto2SlotActive() {
        let photoFrame2 = this.template.querySelector('[data-id="photoFrame2"]');
        photoFrame2.classList.add("active-photo-frame","solve-photo-text-enabled");

        if (photoFrame2 && photoFrame2.classList) {
            if (photoFrame2.classList.contains("disabled-photo-frame")) {
                photoFrame2.classList.remove("disabled-photo-frame");
            }
            if (photoFrame2.classList.contains("solve-photo-text-disabled")) {
                photoFrame2.classList.remove("solve-photo-text-disabled");
            }
        }
    }

    markPhoto2SlotInactive() {
        let photoFrame2 = this.template.querySelector('[data-id="photoFrame2"]');
        photoFrame2.classList.add("disabled-photo-frame","solve-photo-text-disabled");
        if (photoFrame2 && photoFrame2.classList) {
            if (photoFrame2.classList.contains("active-photo-frame")) {
                photoFrame2.classList.remove("active-photo-frame");
            }
            if (photoFrame2.classList.contains("solve-photo-text-enabled")) {
                photoFrame2.classList.remove("solve-photo-text-enabled");
            }
        }
    }

    markPhoto3SlotActive() {
        let photoFrame3 = this.template.querySelector('[data-id="photoFrame3"]');
        photoFrame3.classList.add("active-photo-frame","solve-photo-text-enabled");
        if (photoFrame3 && photoFrame3.classList) {
            if (photoFrame3.classList.contains("disabled-photo-frame")) {
                photoFrame3.classList.remove("disabled-photo-frame");
            }
            if (photoFrame3.classList.contains("solve-photo-text-disabled")) {
                photoFrame3.classList.remove("solve-photo-text-disabled");
            }
        }
    }

    markPhoto3SlotInactive() {
        let photoFrame3 = this.template.querySelector('[data-id="photoFrame3"]');
        photoFrame3.classList.add("disabled-photo-frame","solve-photo-text-disabled");
        if (photoFrame3 && photoFrame3.classList) {
            if (photoFrame3.classList.contains("active-photo-frame")) {
                photoFrame3.classList.remove("active-photo-frame");
            }
            if (photoFrame3.classList.contains("solve-photo-text-enabled")) {
                photoFrame3.classList.remove("solve-photo-text-enabled");
            }
        }        
    }

    markCameraIconDisabled() {
        let cameraIcon = this.template.querySelector('[data-id="cameraIcon"]');
        cameraIcon.classList.remove("active-icon-color");
        cameraIcon.classList.add("disabled-icon-color");
    }

    markCameraIconActive() {
        let cameraIcon = this.template.querySelector('[data-id="cameraIcon"]');
        cameraIcon.classList.remove("disabled-icon-color");
        cameraIcon.classList.add("active-icon-color");
    }

    reorderPhotos() {
        let photo1Slot =  this.template.querySelector('[data-id="photo1"]');
        let photo2Slot =  this.template.querySelector('[data-id="photo2"]');
        let photo3Slot =  this.template.querySelector('[data-id="photo3"]');

        if (!this.hasPhoto1 && this.hasPhoto2) {
            let photo = photo2Slot.getAttribute("src");
            photo1Slot.setAttribute("src",photo);
            photo2Slot.setAttribute("src", null);
            this.hasPhoto1 = true;
            this.hasPhoto2 = false;

            let photo2Div =  this.template.querySelector('[data-id="photo2EnclosingDiv"]');
            photo2Div.classList.add("hide");
            let photo1Div =  this.template.querySelector('[data-id="photo1EnclosingDiv"]');
            photo1Div.classList.remove("hide");

        }
        if (!this.hasPhoto2 && this.hasPhoto3) {
            let photo = photo3Slot.getAttribute("src");
            photo2Slot.setAttribute("src",photo);
            photo3Slot.setAttribute("src", null);
            this.hasPhoto2 = true;
            this.hasPhoto3 = false;
            this.allPhotoSlotsFull = false;
            this.markCameraIconActive();

            let photo3Div =  this.template.querySelector('[data-id="photo3EnclosingDiv"]');
            photo3Div.classList.add("hide");
            let photo2Div =  this.template.querySelector('[data-id="photo2EnclosingDiv"]');
            photo2Div.classList.remove("hide");
        }
    }

    resizeImage(imgToResize) {
        return new Promise((resolve) => {
            var img = new Image();
            img.src = imgToResize;
            img.onload = function() {
                let resizingFactor = 0.2;
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
            
                const originalWidth = img.width;
                const originalHeight = img.height;
            
                const canvasWidth = originalWidth * resizingFactor;
                const canvasHeight = originalHeight * resizingFactor;
            
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;

                context.drawImage(
                    img,
                    0,
                    0,
                    originalWidth * resizingFactor,
                    originalHeight * resizingFactor
                );
                resolve(canvas.toDataURL()); 
            }
        })

    }


    cropImage(imgToResize, aspectRatio) {
        return new Promise((resolve, reject) => {
            // this image will hold our source image data
            const inputImage = new Image();

            // we want to wait for our image to load
            inputImage.onload = () => {
                // let's store the width and height of our image
                const inputWidth = inputImage.naturalWidth;
                const inputHeight = inputImage.naturalHeight;

                // get the aspect ratio of the input image
                const inputImageAspectRatio = inputWidth / inputHeight;

                // if it's bigger than our target aspect ratio
                let outputWidth = inputWidth;
                let outputHeight = inputHeight;
                if (inputImageAspectRatio > aspectRatio) {
                    outputWidth = inputHeight * aspectRatio;
                } else if (inputImageAspectRatio < aspectRatio) {
                    outputHeight = inputWidth / aspectRatio;
                }

                // calculate the position to draw the image at
                const outputX = (outputWidth - inputWidth) * 0.5;
                const outputY = (outputHeight - inputHeight) * 0.5;

                // create a canvas that will present the output image
                const outputImage = document.createElement('canvas');

                // set it to the same size as the image
                outputImage.width = outputWidth;
                outputImage.height = outputHeight;

                // draw our image at position 0, 0 on the canvas
                const ctx = outputImage.getContext('2d');
                ctx.drawImage(inputImage, outputX, outputY);
                resolve(outputImage);
            };

            // start loading our image
            inputImage.src = imgToResize;

        });

    }

    navigateToSolveSite() {
        const sendToArtlandia = {
            type: 'standard__webPage',
            attributes: {
                url: 'http://forcelandia.com'
            }
        };
        this[NavigationMixin.Navigate](sendToArtlandia);
    }

    get startOverContent() {
        return '<p>ARE YOU SURE?</p><br><p>If you start over: any photos you took will still be on your phone, all other data will be deleted.</p>';
    }

    get photoHelpContent() {
        return '<p><strong>DO:</strong></p><ul><li>Take photos from multiple angles and various distances.</li><li>Show potential issues to troubleshoot such as proximity to busy roads, bulky items, heavy pedestrian traffic, etc.</li></ul><p><strong>DON’T:</strong></p><ul><li>Take identifiable photos; exclude people if possible and don’t show faces.</li><li>Take photos of active or abandoned camps.</li></ul>';
    }

    get howUseUseContent() {
        return ' <p><strong>HOW DO I USE THIS APP?</strong></p><br><p>The Artlandia app helps you share locations for weird, wacky, interesting and even mildly disturbing art directly with Artlandia.</p><br><p>FIRST: the app will automatically show your current location on a map. Drag the pin to change the location if necessary. </p><br><p>THEN: share up to 3 photos from different angles to help us evaluate the piece. </p><br><p>FINALLY: share any other relevant details and submit! </p>';
    }

    get thankYouContent() {
        return '<p>GOT IT!</p><br><p>We have received your art report and appreciate your stewardship of Forcelandia\'s very special vibe.</p><br><p>Please share your contact details with us so that we can reach out and coordinate.</p>';
    }

}