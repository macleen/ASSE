<<<<<<< HEAD
//demo file for the package
let clockAbortHandler = function( ) {console.log('==============>>>>>> clock stopped')};
let productAbortHandler = function( ) {console.log('==============>>>>>> products lookup stopped')};
 

let clockPauseHandler = function( ) {console.log('==============>>>>>> clock paused')};
let productPauseHandler = function( ) {console.log('==============>>>>>> products lookup paused')};


let clockResumeHandler = function( ) {
    return new Promise( r => setTimeout(
                             function(){
                                 console.log('==============>>>>>>++++ clock resumed');
                                r('resolved');
                             },3000));
};
let productResumeHandler = function( ) {console.log('==============>>>>>> products lookup resumed')};

let clockNoObserversHandler = function( ) {console.log('==============>>>>>> There are no observers'); /*clock_sse.abortCycle()*/};

let clock_sse = new AlternateSSE({path:''}, { stopCount:Infinity, intervalSeconds: 1, 
                                              onBeforeAbort: clockAbortHandler, 
                                              onBeforePause: clockPauseHandler, 
                                              onBeforeResume: clockResumeHandler, 
                                              onNoObservers: clockNoObserversHandler 
                                            }
                                 );
let products_sse = new AlternateSSE({path:''}, { stopCount:5, intervalSeconds: 4, 
                                                 onBeforeAbort: productAbortHandler, 
                                                 onBeforePause: productPauseHandler, 
                                                 onBeforeResume: productResumeHandler
                                                }
                                   );
let counter = 0;
jsonpath = 'https://reqres.in/api/products/';
//***************************************** */

adjustFetchOptions = ( ) =>{
	if ( counter > 5 )
   	     return  products_sse.abortCycle( );
	counter++;
	console.log(`${jsonpath}${counter}`);
	return {path:`${jsonpath}${counter}`, headers:{originator: 'macleen'}}
}

function display_products(response) { 
    console.log('response =>>>:', response);
    let id = response.response?.data?.id;
    if ( id ) document.querySelector('#prod-'+id).innerHTML = 'name of  prod-'+id+': '+response.response.data.name+' and its color: '+response.response.data.color;
    else throw new Error('ID is not defined');
}

function display_clock( response ) {
    let date = (new Date(Date.now( ))).toString( ).split(' ');;
    document.querySelector('#clock').innerHTML = date[4];
};   

function products( ) {
    products_sse.setFetchOptions(adjustFetchOptions)
                .subscribe(display_products);
}

function clock( ) {
    clock_sse.subscribe(display_clock);
=======
//demo file for the package
let clockAbortHandler = function( ) {console.log('==============>>>>>> clock stopped')};
let productAbortHandler = function( ) {console.log('==============>>>>>> products lookup stopped')};


let clockPauseHandler = function( ) {console.log('==============>>>>>> clock paused')};
let productPauseHandler = function( ) {console.log('==============>>>>>> products lookup paused')};


let clockResumeHandler = function( ) {
    return new Promise( r => setTimeout(
                             function(){
                                 console.log('==============>>>>>>++++ clock resumed');
                                r('resolved');
                             },3000));
};
let productResumeHandler = function( ) {console.log('==============>>>>>> products lookup resumed')};

let clockNoObserversHandler = function( ) {console.log('==============>>>>>> There are no observers'); /*clock_sse.abortCycle()*/};

let clock_sse = new AlternateSSE({path:''}, { stopCount:Infinity, intervalSeconds: 1, 
                                              onBeforeAbort: clockAbortHandler, 
                                              onBeforePause: clockPauseHandler, 
                                              onBeforeResume: clockResumeHandler, 
                                              onNoObservers: clockNoObserversHandler 
                                            }
                                 );
let products_sse = new AlternateSSE({path:''}, { stopCount:5, intervalSeconds: 4, 
                                                 onBeforeAbort: productAbortHandler, 
                                                 onBeforePause: productPauseHandler, 
                                                 onBeforeResume: productResumeHandler
                                                }
                                   );
let counter = 0;
jsonpath = 'https://reqres.in/api/products/';
//***************************************** */

adjustFetchOptions = ( ) =>{
	if ( counter > 5 )
   	     return  products_sse.abortCycle( );
	counter++;
	console.log(`${jsonpath}${counter}`);
	return {path:`${jsonpath}${counter}`, headers:{originator: 'macleen'}}
}

function display_products(response) { 
    console.log('response =>>>:', response);
    let id = response.response?.data?.id;
    if ( id ) document.querySelector('#prod-'+id).innerHTML = 'name of  prod-'+id+': '+response.response.data.name+' and its color: '+response.response.data.color;
    else throw new Error('ID is not defined');
}

function display_clock( response ) {
    let date = (new Date(Date.now( ))).toString( ).split(' ');;
    document.querySelector('#clock').innerHTML = date[4];
};   

function products( ) {
    products_sse.setFetchOptions(adjustFetchOptions)
                .subscribe(display_products);
}

function clock( ) {
    clock_sse.subscribe(display_clock);
>>>>>>> 5c3374067d0d17670aeded1199607fa2ffe49639
}