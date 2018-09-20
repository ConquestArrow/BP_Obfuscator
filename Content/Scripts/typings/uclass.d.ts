// Type definitions for Unreal.js 
// Project: https://github.com/ncsoft/Unreal.js
// Definitions by: ConquestArrow <https://github.com/ConquestArrow/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module "uclass"{
    /**
     * Return a function that convert from a JS class to a Unreal C++ `UClass` or `UStruct`.
     * 
     * 
     * ```js
     * //usage example
     * import uclass from "uclass";
     * let Cls_C = uclass()(global, SrcClass);
     * let cls = new Cls_C;
     * ```
     */
    export default function uclass<T extends (Class|Struct), S extends SourceClass>():UClassifyFunction<T,S>;
}

/**
 * Convert from a JS class to a Unreal C++ `UClass` or `UStruct`.
 */
interface UClassifyFunction<T extends (Class|Struct), S extends SourceClass>{
    /**
     * @param target target scope. eg. `global`
     * @param sourceClass src JS class for convert UClass
     * @return converted constructor
     */
    (target:Object, sourceClass:{new ():S})
        :UClassified<T,S>;
        //:{new ():T & {[P in keyof S]?:S[P]}} ;
}

/**
 * Source converting JS Class
 * @url https://github.com/ncsoft/Unreal.js/wiki/USTRUCT-and-UCLASS
 */
interface SourceClass{
    /**
     * initialization in UE4
     */
    ctor?():void;
    /**
     * property-declarations
     * 
     * ```ts
     * //example
     * properties(){
     *  this.someProp /* EditAnywhere + int *\/;
     * }
     * ```
     * 
     */
    properties(this:this):void;
}

/**
 * uclassified object class
 */
export interface UClassified<T extends (Class|Struct), S extends SourceClass>{
    new (): 
        T & {
            //declared properties in `SourceClass.properties()`
            [P in keyof S]?: S[P]
        }
}

