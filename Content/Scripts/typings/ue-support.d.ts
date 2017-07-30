// Type definitions for Unreal.js
// Project: https://github.com/ncsoft/Unreal.js
// Definitions by: ConquestArrow <https://github.com/ConquestArrow>
/// <reference path="ud.d.ts" />

/**
 * Transaction for undo/redo
 * 
 * ```
 * //example
 * $execTransaction( "Important operation!", () => {
 *  yourPreciousTarget.ModifyObject(true)
 *  yourPreciousTarget.yourPreciousProperty = "ALTERED"
 *  yourPreciousTarget.yourPreciousMethod()
 * })
 * ```
 * 
 * @param oparationName name displayed in undo/redo history
 * @param fn undo/redo operation
 * @url https://github.com/ncsoft/Unreal.js/wiki/Playing-within-editor#transaction-for-undoredo
 */
declare function $execTransaction(oparationName:string, fn:()=>void):void;

/**
 * Editor script execution guard
 * 
 * ```
 * //example
 * $execEditor( () => {
 *  // your code goes here to prevent exec-blocking
 * } )
 * ```
 * 
 * 
 * @param fn 
 * @url https://github.com/ncsoft/Unreal.js/wiki/Playing-within-editor#editor-script-execution-guard
 */
declare function $execEditor(fn:()=>void):void;


declare interface UObject {
    /**
     * Get a outer object with type parameter
     */
    GetOuter<T extends UObject = UObject>():T;
    /**
     * Get a outer most object with type parameter
     */
    GetOutermost<T extends UObject  = UObject>():T;
}



declare interface Blueprint<T = UObject>{
    GeneratedClass:GeneratedClassConstructor<T>
    ;
}

/**
 * BP Generated class constructor
 * This class name is "BP name" + `_C`.(e.g. `BP_Sample_C`)
 */
declare interface GeneratedClassConstructor<T> extends Function{
    /** `[BlueprintClassName]_C` */
    readonly name:string;
    new (...args:any[]):T;
    StaticClass:UnrealEngineClass;
    C(Other: UObject): UObject;
    Find(Outer: UObject, ResourceName: string):UObject;
    GetClassObject():BlueprintGeneratedClass;
    CreateDefaultSubobject(Name: string, Transient?: boolean, Required?: boolean, Abstract?: boolean): UObject;
    SetDefaultSubobjectClass(Name:string):void;
    GetDefaultObject(): T;
    GetDefaultSubobjectByName(Name: string): UObject;
}