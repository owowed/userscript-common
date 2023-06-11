
/**
 * Interface for options used in {@link waitForElementOptions}, used for configuring how its operation works.
 */
export interface WaitForElementOptions {
    /** 
     * If set to true, it will select element by ID, and it will use the {@link document.documentElement} as the parent selector.
     * 
     * This option will precede any other options, such as {@link WaitForElementOptions.multiple} option and the {@link WaitForElementOptions.selector} option, meaning the operation will always select element by the ID specified by {@link WaitForElementOptions.id} option, even if {@link WaitForElementOptions.multiple} or {@link WaitForElementOptions.selector} option is set.
     */
    id?: string;
    /** 
     * The selector for the element.
     * 
     * If set to `string[]`, then it will query select single element for each selector in the array, returning array of element.
     * 
     * If {@link WaitForElementOptions.multiple} option is set to true, then it will query select all element for each selector in array, and then combines them into one, returning array of element.
     */
    selector?: string | string[];
    /** 
     * If {@link ParentNode} is passed, it will use the {@link WaitForElementOptions.parent} element as the parent selector.
     * 
     * This option will limit the scope of the query selector from the {@link WaitForElementOptions.parent} element. This may be useful for optimizing performance.
     */
    parent?: ParentNode;
    /**
     * If set with {@link AbortSignal} instance, user will able to abort this operation by using {@link AbortSignal.abort}.
     */
    abortSignal?: AbortSignal;
    /**
     * If set to true, this operation will query select multiple element by using {@link ParentNode.querySelectorAll} instead of {@link ParentNode.querySelector}.
     */
    multiple?: boolean;
    /**
     * Enable timeout for waiting operation.
     * 
     * If waiting operation reaches timeout, it will throw {@link WaitForElementTimeoutError} or return null, depending on {@link WaitForElementOptions.throwError} option.
     * 
     * The timeout is set by {@link WaitForElementOptions.timeout} option. The timeout is set in millisecond.
     */
    enableTimeout?: boolean;
    /**
     * Set the timeout in millisecond. Default timeout is 5 seconds.
     * 
     * This option will do nothing if {@link WaitForElementOptions.enableTimeout} is set to false.
     */
    timeout?: number;
    /**
     * Set how many attempt this operation can query select the target element.
     * 
     * If it reaches max attempt, it will throw {@link WaitForElementMaximumTriesError} or return null, depending on {@link WaitForElementOptions.throwError} option.
     */
    maxTries?: number;
    /**
     * Ensure DOM content loaded by listening to `DOMContentLoad` event, or checking {@link document.readyState} before running this operation.
     */
    ensureDomContentLoaded?: boolean;
    /** 
     * Set options for {@link MutationObserver} used in this operation.
     */
    observerOptions?: MutationObserverInit;
    /**
     * Filter the target element(s) before being returned.
     */
    filter?: (elem: HTMLElement) => boolean;
    /** 
     * Transform the target element(s) before being returned.
     */
    transform?: (elem: HTMLElement) => HTMLElement;
    /**
     * Specify should the operation throw error or not if unexpected thing happened.
     * 
     * If set to false, then any error occuring event in the operation will return null.
     */
    throwError?: boolean;
}

export type WaitForElementReturnType = HTMLElement | HTMLElement[] | null;

/**
 * Wait and get element that is not yet available in DOM by using element's ID asyncronously. It will use {@link document.getElementById} internally for getting the element.
 * 
 * This is a simple wrapper around {@link waitForElementOptions}.
 * @param id specify element's ID value
 * @param options specify additional options for {@link waitForElementOptions}
 * @returns element with specified ID or null if element not found or something went wrong
 */
export function waitForElementById(id: string, options?: Partial<WaitForElementOptions>): HTMLElement | null;

/**
 * Wait for element that is not available yet in the DOM asyncronously, then return that element.
 * 
 * Instead of query selecting element through {@link document.documentElement}, it will instead use the parent element specified by the `parent` parameter as the scope for query selection.
 * 
 * This may help optimize performance, searching element through specific scope of another element instead of the entire document.
 * 
 * This is a simple wrapper around {@link waitForElementOptions}.
 * @param parent specify scope for target element query selection by parent element
 * @param selector specify selector for the target element
 * @param options specify additional options for {@link waitForElementOptions}
 * @returns return multiple elements in {@link Array}, a single element or null depending on the parameters
 */
export function waitForElementByParent<S extends string>(parent: ParentNode, selector: S, options?: WaitForElementOptions & { multiple: false }): HTMLElementTagNameMap[S] | null;
export function waitForElementByParent(parent: ParentNode, selector: string, options?: WaitForElementOptions & { multiple: false }): HTMLElement | null;
export function waitForElementByParent(parent: ParentNode, selector: string, options?: WaitForElementOptions & { multiple: true }): HTMLElement[] | null;
export function waitForElementByParent(parent: ParentNode, selector: string[], options?: WaitForElementOptions): HTMLElement[] | null;

/**
 * Wait for element that is not available yet in the DOM asyncronously, then return that element.
 * 
 * This is a simple wrapper around {@link waitForElementOptions}.
 * @param selector specify selector for the target element
 * @param options specify additional options for {@link waitForElementOptions}
 * @returns return multiple elements in {@link Array}, a single element or null depending on the parameters
 */
export function waitForElement<S extends string>(selector: S, options?: WaitForElementOptions & { multiple: false }): HTMLElementTagNameMap[S] | null;
export function waitForElement(selector: string, options?: WaitForElementOptions & { multiple: false }): HTMLElement | null;
export function waitForElement(selector: string, options?: WaitForElementOptions & { multiple: true }): HTMLElement[] | null;
export function waitForElement(selector: string[], options?: WaitForElementOptions): HTMLElement[] | null;

/**
 * Wait for element that is not available yet in the DOM asyncronously, then return that element.
 * 
 * This operation works by listening for DOM (or an parent element specified by {@link WaitForElementOptions.parent}) subtree changes using {@link MutationObserver}, then execute element selection each time changes happen.
 * 
 * If an element not found, then it will attempt to retry the same operation again. This repetition can be controlled by using {@link WaitForElementOptions.maxTries}, {@link WaitForElementOptions.timeout}, and etc.
 * 
 * Behavior described here may not be accurate if options is specifically configured.
 * @param options configure how the operation works by specifying options
 * @returns depending on the options, it may return multiple elements in {@link Array}, a single element, or null if element not found or something went wrong
 */
export function waitForElementOptions(options: WaitForElementOptions): WaitForElementReturnType;
export function waitForElementOptions<S extends string>(options: WaitForElementOptions & { selector: S; multiple: false }): HTMLElementTagNameMap[S] | null;
export function waitForElementOptions(options: WaitForElementOptions & { multiple: false }): HTMLElement | null;
export function waitForElementOptions(options: WaitForElementOptions & { multiple: true }): HTMLElement[] | null;
export function waitForElementOptions(options: WaitForElementOptions & { selector: string[] }): HTMLElement[] | null;