# ASSE
>Alternate Server Sent Events package


## Introduction

**Alternate-SSE** is a small sized javascript projecttending to replace the standard server sent event handler.


## What is the difference?

There are few things that I dont like about the standard package

   -  **TimeInterval (std SSE)**\
    Time interval between polls is preset and is not changeable and if it is than you must be really know what you are doing ....


   -  **Server End Point (std SSE)**\
    Same thing as above, you set it once and that is it
    

   -  **Event management (std SSE)**\
    Not pauseable, not cancellable, not resumable



## Instantiation

```javascript
    let ASSE = new AlternateSSE( fetchOptions, options );
```

   -  **FetchOptions**\
    type => object of key value pairs:\    
    path: server endpoint --- optional is a path generator function is supplied
    headers: if any are needed

   -  **Options**\
    type => object of key value pairs:    
    stopCount: 1..Infinity\
    intervalSeconds: 1..Infinity\
    onBeforeAbort: Fire this function before aborting\
    onBeforePause: Fire this function before pausing\
    onBeforeResume: Fire this function before resuming\
    onNoObservers: Fire this function when there are no event observers\


   -  **Illustration**

    
```javascript

    let counter = 0;
    let rawPath = 'https://reqres.in/api/products/';
    //***************************************** */
    //Example of path generator function

    adjustFetchOptions = ( ) =>{
        //*we just need 5 endpoints --- usefull by urls with pagination indexes
        if ( counter > 5 )
             return ASSE.abortCycle( );
        counter++;
        return {path:`${rawPath}${counter}`, headers:{someheader: 'somevalue'}}
    }

    
    //***************************************** */
    //Example of event Observers


    event_watcher_1( response ) {
        let a = 1+1;
        //..... code goes here
    };   

    event_watcher_2( response ) {
        let b = 1+1;
        //..... code goes here

    };   

    ASSE.setFetchOptions(adjustFetchOptions)
        .subscribe(event_watcher_1)
        .subscribe(event_watcher_2)
        .subscribe(event_watcher_n)

```

-  **Event management**

```javascript

       let pauseBtn  = document.querySelector('#btn1');
       let resumeBtn = document.querySelector('#btn2');
       let abortBtn  = document.querySelector('#btn3');

       pauseBtn.addEventListener('click',  ASSE.pauseCycle);
       resumeBtn.addEventListener('click',  ASSE.resumeCycle);
       abortBtn.addEventListener('click',  ASSE.abortCycle);

```

---------------------------------------------------------
 >Author: C. Mahmoud / MacLeen 2021 v 2.0.0 / email: **acutclub@gmail.com**\
 >For bugs, suggestions or any other info please contact me on my email.
