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
