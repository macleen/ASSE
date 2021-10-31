/**
 * @Alternate SSE (Alternate Server Sent Events)
 * @Features  (1): SSE - Pauseable, Resumable, Cancellable & Abortable
 *            (2): Can be used as a TICKER besides the main function - AJAX polls
 *            (3): Adjustable numbers of polls ( 1, many or forever )
 *    
 * @param {object} fetchOptions see here under
 * @param {object} options see here under
 * 
 * fetchOptions = {path:'resource URI or empty of URL gen-function is available', headers:{ headers }}
 * options = { stopCount: number of ticks / Infinity: forever, 
 *             intervalSeconds: interval in seconds between ticks,
 *             onBeforePause, onBeforeResume,onBeforeAbort, onNoObservers: user defined call backs for the specified action
 *  }
 * -----------------------------------------------------------------------------
 * Author: MacLeen Soft 2021 ( v2 ) October 30th / acutclub@gmail.com
 * Licence: MIT
*/    

class AlternateSSE {

    static EVENT_TYPE         = 'ASSE';
    static RUN_STATES         = { inactive:0, running:1, paused: 2 };


    constructor( fetchOptions = { path:'', headers:{ }}, options = { }) {

        this.loopCounter      = 0;
        this.data             = '';
        this.observers        = [];
        this.state            = AlternateSSE.RUN_STATES.inactive;
        this.#getUserOptions( fetchOptions, options );

    }

    #getUserOptions( fetchOptions, options ) {
        this.controller   = {
                               enumerable  : false,
                               writable    : false,
                               configurable: false,
                               value       : new AbortController( )
                            };
        this.fetchOptions = Object.assign( fetchOptions, { signal: this.controller.value.signal });
        this.options      = Object.assign({ 
                               stopCount    : 1   , intervalSeconds: 0,
                               onBeforePause: null, onBeforeResume : null,
                               onBeforeAbort: null, onNoObservers  : null, 
                            }, options );
    }

    #isValidUrl( u ) {
        try { let x = new URL( u )} 
        catch( e ){ return !!0 }
        return !!1;
    }    


    /**
     * process user CallBacks
     * @accessType private
     * @param {function} fn user func to execute
     * @param {object} context context for external class handlers
     * @returns {promise} 
    */    
    async #processCallBack( fn = null, context = null ){
        return await new Promise( r => typeof fn === 'function' ? r(fn.call(context, ...arguments)) : r(void(0)));
    }


    #asyncGenerator( ) {
        let source = this;
        return {
                async *[Symbol.asyncIterator]( ){
                    while ( source.loopCounter++ <= source.options.stopCount ) {
                            await new Promise( resolve => setTimeout( resolve, source.options.intervalSeconds * 1000 ))
                            let url = source.fetchOptions.path;
                            if ( url ) {
                                 if ( source.#isValidUrl( url )) {
                                      let resp = await fetch( url, source.fetchOptions );
                                      yield await resp.json( );
                                 } else throw new Error('Invalid URL: '+url);
                            } else yield source.loopCounter;
                    }
                    return {done: true, value:-1};
                }
        }
    }


    #verifyObservers( context = null ) {
        if ( !this.observers.length && typeof this.options.onNoObservers === 'function' ) 
              this.options.onNoObservers.call( context,...arguments );
        return this;
    }

    subscribe( fn, context = null ) {
        if ( typeof fn === 'function' ) {
             this.observers.push( fn );
             return this.state === AlternateSSE.RUN_STATES.inactive ? this.#startCycle( context ) : this;
        }
        throw new Error('Observer must be a Callable')     
    }

    unsubscribe( fn ) {
        this.observers = this.observers.filter( f => f != fn );
        return this.#verifyObservers( );
    }

    unsubscribeAll( ) {
        this.observers = [];
        return this;
    }

    notifyObservers( context = null, ...args ) {
        if ( this.observers.length )
             this.observers.forEach( fn => fn.call( context, ...args));
    }

    
    /**
     * Sets the user call back to adjust the fetchOptions, path, headers etc...
     * UserCallback (if set) is an arbitrary function for computing the dependency path(s) 
     * @accessType public
     * @param {function} userCallBack optional if path is set in the constructor / returns an object with fetch options
     * @param {object} context context of execution if userCallback is a class method
     * @returns {string} the path to be used with the fetch call
    */
    setFetchOptions( userCallBack = null, context = this ){

        if ( typeof userCallBack === 'function' ) {
             this.fetchOptions = new Proxy( this.fetchOptions, {
                get( target, prop ) {
                    if (prop == 'path')
                        return prop != 'path' ? target[prop]
                                      : userCallBack.call( context, ...arguments )?.path;
                }
             });
        }
        return this;     
    }


    /**
     * dispatches the event and sets the event data to be returned
     * @accessType public     
     * @param {object} context theThis argument, default: null -> current
     * @param {boolean} freshStart indicator ( true: start - false: resume )
    */
     async #startCycle( context = null, freshStart = true ){

           this.state       = AlternateSSE.RUN_STATES.running;
           this.loopCounter = freshStart ? 0 : this.loopCounter;
           __LOOP__: for await ( let data of this.#asyncGenerator( )) {
                         this.notifyObservers(context, {type: AlternateSSE.EVENT_TYPE, timestamp: Date.now( ), response: data});
                         if ( this.state != AlternateSSE.RUN_STATES.running ) break __LOOP__;
                     }
           return this;

    }

    /**
     * aborts the initially started cycle with startCycle - remove the event from the event queue and issues a fetch controller abort
     * @accessType public
     * @param {object} context context for external class handlers
     * @returns {any} onBeforeAbort res | res from removeEventListener
    */    
    abortCycle( context = null ){
        this.state = AlternateSSE.RUN_STATES.inactive;
        this.controller.value.abort( );
        return this.unsubscribeAll( ).#processCallBack(this.options.onBeforeAbort, context);
    }


    /**
     * pauses the started cycle with startCycle - remove the event from the event queue
     * @accessType public
     * @param {object} context context for external class handlers
     * @returns {any} onBeforePause res | res from removeEventListener
    */    
    pauseCycle( context = null ){
        if ( this.state === AlternateSSE.RUN_STATES.running ) {
             this.state = AlternateSSE.RUN_STATES.paused;
             return this.#processCallBack(this.options.onBeforePause, context);
        }     
        throw new Error('Only running states can be paused');
    }

    /**
     * Resumes the paused cycle
     * @accessType public
     * @param {object} context context for external class handlers
     * @returns {any} onBeforePause res | res from removeEventListener
    */    
     resumeCycle( context = null ){
        if ( this.state === AlternateSSE.RUN_STATES.paused ) {
             return this.#processCallBack( this.options.onBeforeResume, context )
                        .then(( ) => this.#startCycle( context, false ));

        }    
        throw new Error('Only paused states can be resumed');
    }

=======
/**
 * @Alternate SSE (Alternate Server Sent Events)
 * @Features  (1): SSE - Pauseable, Resumable, Cancellable & Abortable
 *            (2): Can be used as a TICKER besides the main function - AJAX polls
 *            (3): Adjustable numbers of polls ( 1, many or forever )
 * 
 * @param {object} fetchOptions see here under
 * @param {object} options see here under
 * 
 * fetchOptions = {path:'resource URI or empty of URL gen-function is available', headers:{ headers }}
 * options = { stopCount: number of ticks / Infinity: forever, 
 *             intervalSeconds: interval in seconds between ticks,
 *             onBeforePause, onBeforeResume,onBeforeAbort, onNoObservers: user defined call backs for the specified action
 *  }
 * -----------------------------------------------------------------------------
 * Author: MacLeen Soft 2021 ( v2 ) October 30th / acutclub@gmail.com
 * Licence: MIT
*/    

class AlternateSSE {

    static EVENT_TYPE         = 'ASSE';
    static RUN_STATES         = { inactive:0, running:1, paused: 2 };


    constructor( fetchOptions = { path:'', headers:{ }}, options = { }) {

        this.loopCounter      = 0;
        this.data             = '';
        this.observers        = [];
        this.state            = AlternateSSE.RUN_STATES.inactive;
        this.#getUserOptions( fetchOptions, options );

    }

    #getUserOptions( fetchOptions, options ) {
        this.controller   = {
                               enumerable  : false,
                               writable    : false,
                               configurable: false,
                               value       : new AbortController( )
                            };
        this.fetchOptions = Object.assign( fetchOptions, { signal: this.controller.value.signal });
        this.options      = Object.assign({ 
                               stopCount    : 1   , intervalSeconds: 0,
                               onBeforePause: null, onBeforeResume : null,
                               onBeforeAbort: null, onNoObservers  : null, 
                            }, options );
    }

    #isValidUrl( u ) {
        try { let x = new URL( u )} 
        catch( e ){ return !!0 }
        return !!1;
    }    


    /**
     * process user CallBacks
     * @accessType private
     * @param {function} fn user func to execute
     * @param {object} context context for external class handlers
     * @returns {promise} 
    */    
    async #processCallBack( fn = null, context = null ){
        return await new Promise( r => typeof fn === 'function' ? r(fn.call(context, ...arguments)) : r(void(0)));
    }


    #asyncGenerator( ) {
        let source = this;
        return {
                async *[Symbol.asyncIterator]( ){
                    while ( source.loopCounter++ <= source.options.stopCount ) {
                            await new Promise( resolve => setTimeout( resolve, source.options.intervalSeconds * 1000 ))
                            let url = source.fetchOptions.path;
                            if ( url ) {
                                 if ( source.#isValidUrl( url )) {
                                      let resp = await fetch( url, source.fetchOptions );
                                      yield await resp.json( );
                                 } else throw new Error('Invalid URL: '+url);
                            } else yield source.loopCounter;
                    }
                    return {done: true, value:-1};
                }
        }
    }


    #verifyObservers( context = null ) {
        if ( !this.observers.length && typeof this.options.onNoObservers === 'function' ) 
              this.options.onNoObservers.call( context,...arguments );
        return this;
    }

    subscribe( fn, context = null ) {
        if ( typeof fn === 'function' ) {
             this.observers.push( fn );
             return this.state === AlternateSSE.RUN_STATES.inactive ? this.#startCycle( context ) : this;
        }
        throw new Error('Observer must be a Callable')     
    }

    unsubscribe( fn ) {
        this.observers = this.observers.filter( f => f != fn );
        return this.#verifyObservers( );
    }

    unsubscribeAll( ) {
        this.observers = [];
        return this;
    }

    notifyObservers( context = null, ...args ) {
        if ( this.observers.length )
             this.observers.forEach( fn => fn.call( context, ...args));
    }

    
    /**
     * Sets the user call back to adjust the fetchOptions, path, headers etc...
     * UserCallback (if set) is an arbitrary function for computing the dependency path(s) 
     * @accessType public
     * @param {function} userCallBack optional if path is set in the constructor / returns an object with fetch options
     * @param {object} context context of execution if userCallback is a class method
     * @returns {string} the path to be used with the fetch call
    */
    setFetchOptions( userCallBack = null, context = this ){

        if ( typeof userCallBack === 'function' ) {
             this.fetchOptions = new Proxy( this.fetchOptions, {
                get( target, prop ) {
                    if (prop == 'path')
                        return prop != 'path' ? target[prop]
                                      : userCallBack.call( context, ...arguments )?.path;
                }
             });
        }
        return this;     
    }


    /**
     * dispatches the event and sets the event data to be returned
     * @accessType public     
     * @param {object} context theThis argument, default: null -> current
     * @param {boolean} freshStart indicator ( true: start - false: resume )
    */
     async #startCycle( context = null, freshStart = true ){

           this.state       = AlternateSSE.RUN_STATES.running;
           this.loopCounter = freshStart ? 0 : this.loopCounter;
           __LOOP__: for await ( let data of this.#asyncGenerator( )) {
                         this.notifyObservers(context, {type: AlternateSSE.EVENT_TYPE, timestamp: Date.now( ), response: data});
                         if ( this.state != AlternateSSE.RUN_STATES.running ) break __LOOP__;
                     }
           return this;

    }

    /**
     * aborts the initially started cycle with startCycle - remove the event from the event queue and issues a fetch controller abort
     * @accessType public
     * @param {object} context context for external class handlers
     * @returns {any} onBeforeAbort res | res from removeEventListener
    */    
    abortCycle( context = null ){
        this.state = AlternateSSE.RUN_STATES.inactive;
        this.controller.value.abort( );
        return this.unsubscribeAll( ).#processCallBack(this.options.onBeforeAbort, context);
    }


    /**
     * pauses the started cycle with startCycle - remove the event from the event queue
     * @accessType public
     * @param {object} context context for external class handlers
     * @returns {any} onBeforePause res | res from removeEventListener
    */    
    pauseCycle( context = null ){
        if ( this.state === AlternateSSE.RUN_STATES.running ) {
             this.state = AlternateSSE.RUN_STATES.paused;
             return this.#processCallBack(this.options.onBeforePause, context);
        }     
        throw new Error('Only running states can be paused');
    }

    /**
     * Resumes the paused cycle
     * @accessType public
     * @param {object} context context for external class handlers
     * @returns {any} onBeforePause res | res from removeEventListener
    */    
     resumeCycle( context = null ){
        if ( this.state === AlternateSSE.RUN_STATES.paused ) {
             return this.#processCallBack( this.options.onBeforeResume, context )
                        .then(( ) => this.#startCycle( context, false ));

        }    
        throw new Error('Only paused states can be resumed');
    }

>>>>>>> 5c3374067d0d17670aeded1199607fa2ffe49639
}