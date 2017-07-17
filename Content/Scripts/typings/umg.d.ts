

declare module "UMG" {
    /**
     * Slate in C++ easily translater
     */
    interface UMG {

        //<T extends UMG.Types.Type>(type: T, opts: UMG.Types.Option<T>, template?: UMG.Types.Template): UMG.Types.Base<T>;
        
        /**
         * Easy translater for UMG/Slate objects
         * 
         * @param type a UMG/Slate object extends typeof `Widget`.
         * @param opts option parameters of UMG/Slate object class.
         * @param template children UMG/Slate objects or a template strings
         */
        <T extends Widget = Widget>(
            type: {new ():T},
            opts: UMG.Types.Option<T>,
            ...template?: typeof Visual[] | string[]
        ): instantiate.Design<T>;


        /**
         * create TextBlock
         */
        text(opts: UMG.Types.Option<TextBlock>, text?: string): UMG.Types.Base<TextBlock>;

        /**
         * create VerticalBox
         */
        div(opts: UMG.Types.Option<VerticalBox>, ...array: Array<UMG.Types.Base<typeof Visual>> ): UMG.Types.Base<VerticalBox>;

        /**
         * create HorizontalBox
         */
        span(opts: UMG.Types.Option<HorizontalBox>, ...array: UMG.Types.Base<typeof Visual>[]): UMG.Types.Base<HorizontalBox>;
    }

    namespace UMG.Types{

        
        interface OptEvents<T>{
            /**
             * invoke UMG
             */
            $link?: (elem:T, context?:JavascriptContext) => void;
            /**
             * 
             */
            $unlink?: (elem:T) => void;
        }
        interface OptUMG<T>{
            Id?: string;
        }
        interface OptShort<T>{
            'slot.size.size-rule'?: ESlateSizeRule
        }
        /**
         * Option parameters object for a UMG/Slate object
         */
        type Option<T> = PartialPartial<T> & OptEvents<T> & OptUMG<T> & OptShort<T>;


        interface Base<
            T extends Visual = Visual
        >{
            attrs:PartialPartial<T>;
            children:Base<Visual>[];
        }

        type PartialPartial<T> = {
            [P in keyof T]? : PartialPartial<T[P]>;
        }
    }

    var UMG:UMG;
    export = UMG;
}