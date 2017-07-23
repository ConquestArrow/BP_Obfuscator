import bootstrap from "./bootstrap"
import * as UMG from "UMG"
const I = require('instantiator');
const EMaker = require("editor-maker");
const UClass = require("uclass")

declare let Root:JavascriptEditorTick;
declare let $execTransaction:(oparationName:string, fn:()=>void)=>void;
declare let $execEditor:(fn:()=>void)=>void;

function main(){
    
    let GEngine = Root.GetEngine();
    let GWorld = GEngine.GetEditorWorld()

    //menu group settings
    if(!(<any>global).editorGroup){
        (<any>global).editorGroup = JavascriptWorkspaceItem.AddGroup(JavascriptWorkspaceItem.GetGroup("Root"), "BP Tools");
    }

    if(!(<any>global).tabGroup){
        (<any>global).tabGroup = JavascriptWorkspaceItem.AddGroup((<any>global).editorGroup, "Tabs");
    }

    if(!(<any>global).innerGroup){
        (<any>global).innerGroup = JavascriptWorkspaceItem.AddGroup((<any>global).tabGroup, "Inner");
    }

    let bp = Blueprint.Load("/Game/BP_Sample")  //tmp

    let listeners:any[] = []

    let commands:JavascriptUICommands;
    let commandList:JavascriptUICommandList;

    //GraphEditor View
    let w = new JavascriptGraphEditorWidget(bp.UbergraphPages[0].GetOuter())
    w.SetGraph(bp.UbergraphPages[0] as JavascriptGraphEdGraph)
    let appear = new JavascriptGraphAppearanceInfo();
    appear.CornerText = "BP Obfuscator"
    w.AppearanceInfo = appear;


    let targetBPs = [
        bp,
        Blueprint.Load("/Game/BP_2")
    ]

    /* -------------------------
    commands
    ---------------------------*/
    enum CmdNum{
        Obfuscate,
        Random,
        Shrink,
        RemoveCommentNode,
        RemoveCommentBubble,
        RenameVariable,
        RenameFunction,
        RenameMacro,
        
    }

    /* --------------------------
    options
    ---------------------------*/
    /**
     * Obfuscate layout options
     */
    enum EObfuscateLayoutMode{
        Random,
        Shrink
    }
    /**
     * @default EObfuscateLayoutMode.Random
     */
    let currentLayoutOption = EObfuscateLayoutMode.Random;

    let isRemovingCommentNode = true;

    let isRemovingCommentBubble = true;

    let isRename = {
        [CmdNum.RenameVariable]:true,
        [CmdNum.RenameFunction]:false,
        [CmdNum.RenameMacro]:false
    }

    /**
     * key = graph, value = parent bp
     */
    let dicBP = new Map<EdGraph,Blueprint>();

    let graphView:JavascriptGraphEditorWidget;
    let graphViewInTab:JavascriptGraphEditorWidget

    let editorStyle = new JavascriptStyleSet
    editorStyle.StyleSetName = 'EditorStyle'

    //button Font
    const btnFont = {FontObject:GEngine.SmallFont,Size:10};
    const btnFColor = new LinearColor()
    btnFColor.R = btnFColor.G = btnFColor.B = 0;
    btnFColor.A = 100;

    //menubar Font
    const menuFont = {FontObject:GEngine.TinyFont, Size:10};

    //toolbar button style
    let ButtonStyleName = "ToolbarButtonStyle"
    let Icon40x40:Vector2D = {X:40,Y:40} as Vector2D;
    let toolBtnStyle = JavascriptUMGLibrary.CreateSlateStyle(ButtonStyleName)
    toolBtnStyle.SetContentRoot( Context.GetDir('EngineContent') + "Editor/Slate" );
	toolBtnStyle.SetCoreContentRoot( Context.GetDir('EngineContent') + "Slate" );    
    toolBtnStyle.AddImageBrush("BP_Obfuscator.Obfuscate", toolBtnStyle.RootToContentDir("Icons/icon_Editor_Preferences_40x.png"), Icon40x40, {R:1,G:1,B:1,A:1} as LinearColor, 'NoTile', 'FullColor' )
    toolBtnStyle.AddImageBrush("BP_Obfuscator.Save", toolBtnStyle.RootToContentDir("Icons/icon_SaveAsset_40x.png"), Icon40x40, {R:1,G:1,B:1,A:1} as LinearColor, 'NoTile', 'FullColor' )
    toolBtnStyle.AddBoxBrush("BP_Obfuscator.RemoveCommentNode", toolBtnStyle.RootToContentDir("Icons/icon_Blueprint_Comment_16x.png"), {} as Margin,{R:1,G:1,B:1,A:1} as LinearColor,ESlateBrushImageType.FullColor)

    toolBtnStyle.AddBoxBrush("BP_Obfuscator.RemoveCommentBubble", toolBtnStyle.RootToContentDir("Icons/icon_Blueprint_CommentBubbleOn_16x.png"), {} as Margin,{R:1,G:1,B:1,A:1} as LinearColor,ESlateBrushImageType.FullColor)
    //toolBtnStyle.AddBoxBrush()
    
    
    


    //layout
    //not use
    let layout = {
        Type:"Layout",
        Name:"BP_Obfuscator",   
        PrimaryAreaIndex: 0,
        Areas:[
            {
                Type:"Area",
                Orientation: "Orient_Vertical",
                WindowPlacement: 'Placement_NoWindow',
                SizeCoefficient: 1,
                Nodes:[
                    {
                        Type: 'Stack',
                        Orientation: "Orient_Horizontal",
                        SizeCoefficient: 0.1,
                        HideTabWell: true,
                        Tabs: [
                            {                                
                                TabId: 'MenuTab',
                                TabState: 'OpenedTab'
                            }
                        ]
                    },
                    {
                        Type: 'Splitter',
                        Orientation: "Orient_Horizontal",
                        SizeCoefficient: 0.8,
                        HideTabWell: true,
                        Nodes:[
                            {
                                Type: 'Stack',
                                SizeCoefficient: 0.2,
                                HideTabWell: true,
                                Tabs: [
                                    {                                
                                        TabId: 'OptionTab',
                                        TabState: 'OpenedTab'
                                    }
                                ]
                            },
                            {
                                Type: 'Stack',
                                SizeCoefficient: 0.2,
                                HideTabWell: true,
                                Tabs: [
                                    {                                
                                        TabId: 'TargetTab',
                                        TabState: 'OpenedTab'
                                    }
                                ]
                            },
                            {
                                Type: 'Stack',
                                SizeCoefficient: 0.6,
                                HideTabWell: false,
                                Tabs: [
                                    {                                
                                        TabId: 'GraphTab',
                                        TabState: 'OpenedTab'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }

    /**
     * tabs
     * @info currently unused.
     */
    let tabs:JavascriptEditorTab[] = [
        EMaker.tab(
            {
                TabId:"MenuTab",
                Role:EJavascriptTabRole.PanelTab,
                DisplayName:"Menu",
                Group: (<any>global).tabGroup
            },
            ()=>{
                return I(UMG.text({},"menu"))
            },
            (widget:Widget)=>{
                widget = null;
            }
        ),
        EMaker.tab(
            {
                TabId:"OptionTab",
                Role:EJavascriptTabRole.PanelTab,
                DisplayName:"Options",
                Group: (<any>global).tabGroup
            },
            ()=>{
                return I(UMG.text({},"options"))
            },
            (widget:Widget)=>{
                widget = null;
            }
        ),
        EMaker.tab(
            {
                TabId:"TargetTab",
                Role:EJavascriptTabRole.PanelTab,
                DisplayName:"TargetGraphs",
                Group: (<any>global).tabGroup
            },
            ()=>{
                return I(UMG.div(
                    {
                        //'slot.size.size-rule' : 'Fill',
                        //Background: editorStyle.GetBrush('ProjectBrowser.Background')
                    },
                    UMG<Border>(Border,
                        {
                            'slot.size.size-rule' : 'Fill',
                            Background: editorStyle.GetBrush('ProjectBrowser.Background')
                        }, 
                        UMG<JavascriptTreeView>(JavascriptTreeView,
                            {
                                SelectionMode:ESelectionMode.SingleToggle,
                                OnGenerateRowEvent:(obj:Blueprint, id:String, list:JavascriptTreeView) => {
                                    let nBP = obj.GetName()
                                    //list.SetSingleExpandedItem(obj)
                                    return I(UMG.span({},
                                        UMG(CheckBox,{}),
                                        UMG.text({Font : {FontObject : GEngine.SmallFont,Size:10}}, nBP)
                                    ))
                                },
                                
                                OnGetChildren:(item:Blueprint, list:JavascriptTreeView) =>{

                                    if(item instanceof EdGraph){
                                        return;
                                    }

                                    console.log("on get children")
                                    
                                    let gs:EdGraph[] = []
                                    if(item.UbergraphPages){
                                        gs = [...gs, ...item.UbergraphPages]
                                    }
                                    if(item.FunctionGraphs){
                                        gs = [...gs, ...item.FunctionGraphs]
                                    }
                                    if(item.MacroGraphs){
                                        gs = [...gs, ...item.MacroGraphs]
                                    }
                                    //
                                    //gs = Array.concat(gs, item.FunctionGraphs)
                                    //gs = gs.concat(item.MacroGraphs)


                                    list.Children = gs;
                                    //if(list.Children && list.Children.length > 1){
                                    if(!list.IsItemExpanded(item)){
                                       // list.SetSingleExpandedItem(item)
                                    }
                                    //    list.SetSingleExpandedItem(item)
                                    //}
                                    
                                },
                                OnExpansionChanged:(Item: UObject, bExpanded: boolean, Instance: JavascriptTreeView)=>{
                                    console.log("expansion changed")
                                },
                                $link: (elem:JavascriptTreeView) => {
                                    elem.JavascriptContext = Context
                                    elem.Items = targetBPs;
                                    elem.Items.forEach(v => {
                                        elem.SetItemExpansion(v, true)
                                    });
                                    
                                    (<any>elem).proxy = {
                                        OnSelectionChanged:(item:UObject, type:ESelectInfo) =>{
                                            console.log("item", item)
                                            //tabManager.Tabs[3].Discard()

                                            //w.SetGraph(Blueprint.Load("/Game/BP_2").UbergraphPages[0]  as JavascriptGraphEdGraph)

                                            

                                            if(item instanceof Blueprint)return;

                                            let parent = graphViewInTab.GetParent()
                                            console.log("parent in tab", parent, JSON.stringify(parent))
                                            graphViewInTab.SetGraph(item as JavascriptGraphEdGraph);

                                            ;(<any>graphViewInTab).$update();
                                        },
                                    }
                                    elem.SetSingleExpandedItem(elem.Items[0])

                                    console.log(elem.IsItemExpanded(elem.Items[0]))
                                    //elem.RequestTreeRefresh();
                                },
                                $unlink: (elem:UObject) => {

                                }
                            }
                        ),
                    ),
                    UMG.text({},"target graphs")
                ))
            },
            (widget:Widget)=>{
                widget = null;
            }
        ),
        EMaker.tab(
            {
                TabId:"GraphTab",
                Role:EJavascriptTabRole.PanelTab,
                DisplayName:"GraphView",
                Group: (<any>global).tabGroup
            },
            //()=> w,
            () => {
                graphTab = 
                I(UMG(
                    JavascriptGraphEditorWidget,
                    {
                        AppearanceInfo:{
                            CornerText:"BP Obfuscator"
                        },
                        $link: (elem:JavascriptGraphEditorWidget) => {
                            elem.SetGraph(bp.UbergraphPages[0] as JavascriptGraphEdGraph)

                            ;(<any>elem).$update = () => {
                                let parent = elem.GetParent();
                                parent.RemoveChild(elem);
                                parent.AddChild(elem);
                            }

                            graphViewInTab = elem;
                            /*
                            elem.SetGraph(bp.UbergraphPages[0] as JavascriptGraphEdGraph)
                            graphView = elem;
                            
                            //console.log("graph!", JSON.stringify(elem))
                            elem.SelectObject(elem, true)
                            
                            ;(<any>elem).$update = () => {
                                console.log("$u-pdate!")
                                console.log("updated graph!", JSON.stringify(elem))
                            }
                            
                            //*
                            listeners.push(elem);
                            //*/
                            
                        },
                        $unlink: (elem:JavascriptGraphEditorWidget)=>{
                            elem.Slot.Content = null;
                            //listeners.splice(listeners.indexOf(elem),1)
                        }
                    }
                ))

                /*
                let tmInner = new JavascriptEditorTabManager(tabPackage)
                tmInner.Tabs = [EMaker.tab({
                    TabId:"Inner1",
                    Role:EJavascriptTabRole.PanelTab,
                    DisplayName:"GraphViewInner",
                    Group: (<any>global).innerGroup
                },()=>graphTab)]
                tmInner.Layout = JSON.stringify({
                    Type:"Layout",
                    Name:"BP_Obfuscator",   
                    PrimaryAreaIndex: 0,
                    Area:[
                        {
                            Type:"Area",
                            Orientation: "Orient_Vertical",
                            WindowPlacement: 'Placement_NoWindow',
                            SizeCoefficient: 1,
                            Nodes:[
                                {
                                    Type: 'Stack',
                                    Tabs:[
                                        {
                                            TabId:"Inner1",
                                            TabState: "OpenedTab"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                })
                return I(UMG(JavascriptEditorTabManager,
                    {
                        Tabs:tmInner.Tabs,
                        Layout:tmInner.Layout,
                        $link:(elem:JavascriptEditorTabManager)=>{
                            //elem.AddChild(tmInner)
                        },
                        $unlink:(elem:any) => {
                            tmInner.Tabs.forEach(tab => tab.CloseTab(elem))
                        }
                    }
                ))
                */
                /*
                return I(UMG(NativeWidgetHost,{
                    $link:(item:NativeWidgetHost)=>{
                        item.Slot = (<any>item).SlotAsBorderSlot(graphTab);
                    }
                }))*/


                return graphTab
            },
            (widget:JavascriptGraphEditorWidget)=>{
                console.log("graph tab close", JSON.stringify(widget))
                //widget = null;
                //let content = widget.Slot.Content;
                widget.AppearanceInfo.CornerText = "hoge"
                //(<any>content).destroy()
            }
        ),
    ]
    let graphTab:Widget;
    JavascriptTreeView
    JavascriptGraphEditorWidget
    

    let tabPackage = JavascriptLibrary.CreatePackage(Root,'/Script/Javascript')

    let tabManager = new JavascriptEditorTabManager(tabPackage)
    tabManager.Tabs = tabs
    tabManager.Layout = JSON.stringify(layout);

    
    
    

    //Editor window with tab simple template
    let mkTab = function(tm:JavascriptEditorTabManager){
        EMaker.tabSpawner(
            {
                DisplayName:"BP Obfuscator",
                TabId: "BPObfuscator@",
                Role: EJavascriptTabRole.MajorTab,
                Group: (<any>global).editorGroup
            },
            () => I(
                
                UMG.div(
                    {

                        'slot.size.size-rule' : ESlateSizeRule.Fill,
                        $link:(elem:any) => {
                            //elem.AddChild(tm)//
                        },
                        $unlink:(elem:any) => {
                            //tm.Tabs.forEach(tab => tab.CloseTab(elem))
                            //tabManager = null
                        }
                    },
                    //menu bar
                    UMG(JavascriptMultiBox,{
                        OnHook:(id:string, elem:JavascriptMultiBox, builder:JavascriptMenuBuilder)=>{
                            console.log("create menu bar", id)
                            JavascriptMenuLibrary.CreateMenuBarBuilder(
                                commandList,
                                <any>((b:JavascriptMenuBuilder)=>{
                                    b.AddPullDownMenu(
                                        "Option","Obfuscate options",
                                        <any>((b:JavascriptMenuBuilder)=>{
                                            b.PushCommandList(commandList)
                                            //b.AddSeparator()
                                            //b.AddMenuEntry()
                                            /*
                                            b.BeginSection("Layout")
                                            b.AddWidget(I(UMG.text({Font:menuFont},"Layout")),"",true)
                                            b.AddToolBarButton(commands.CommandInfos[CmdNum.Random])
                                            b.AddToolBarButton(commands.CommandInfos[CmdNum.Shrink])
                                            b.EndSection()
                                            b.BeginSection("group 2")

                                            b.AddToolBarButton(commands.CommandInfos[CmdNum.RemoveCommentNode])
                                            //elem.AddSubMenu(b,'Sub','Sub menu','Sub menu tooltip',true)
                                            b.EndSection()
                                            */
                                        })
                                    )
                                    //elem.AddPullDownMenu(b,"Sub","men2","sub...")

                                    JavascriptMultiBox.Bind(b)
                                })
                            )
                        }
                    }),
                    UMG.span(
                        {'slot.size.size-rule' : ESlateSizeRule.Fill,},
                        UMG.div(
                            {
                                Slot:{
                                    Size:{
                                        Value:0.3,
                                        SizeRule: ESlateSizeRule.Fill,
                                        VerticalAlignment: EVerticalAlignment.VAlign_Fill
                                    }
                                } as any,
                                //'slot.size.size-rule' : ESlateSizeRule.Fill
                            },
                            UMG(Border, {
                                    //'slot.size.size-rule' : ESlateSizeRule.Automatic,
                                    //'slot.size.vertical-align' : EVerticalAlignment.VAlign_Fill,
                                    Slot:{
                                        //Size:{
                                            //Value:0.3,
                                            //SizeRule: ESlateSizeRule.Fill,
                                            
                                        //}
                                    },
                                    VerticalAlignment: EVerticalAlignment.VAlign_Fill,
                                    'slot.size.size-rule' : ESlateSizeRule.Fill,
                                    Background: editorStyle.GetBrush('ProjectBrowser.Background')
                                },
                                UMG(JavascriptTreeView,
                                    {
                                    SelectionMode:ESelectionMode.SingleToggle,
                                    OnGenerateRowEvent:(obj:Blueprint, id:String, list:JavascriptTreeView) => {
                                        let nBP = obj.GetName()
                                        //obj.Status
                                        //list.SetSingleExpandedItem(obj)
                                        return I(UMG.span({},
                                            //UMG(CheckBox,{}),
                                            UMG.text({Font : {FontObject : GEngine.SmallFont,Size:10}}, nBP)
                                        ))
                                    },
                                    OnGetChildren:(item:Blueprint, list:JavascriptTreeView) =>{

                                        if(item instanceof EdGraph){
                                            return;
                                        }

                                        console.log("on get children")
                                        
                                        let gs:EdGraph[] = []
                                        if(item.UbergraphPages){
                                            gs = [...gs, ...item.UbergraphPages]
                                        }
                                        if(item.FunctionGraphs){
                                            gs = [...gs, ...item.FunctionGraphs]
                                        }
                                        if(item.MacroGraphs){
                                            gs = [...gs, ...item.MacroGraphs]
                                        }
                                        //
                                        //gs = Array.concat(gs, item.FunctionGraphs)
                                        //gs = gs.concat(item.MacroGraphs)


                                        list.Children = gs;

                                        //set manage parent bp
                                        gs.forEach(v=>{
                                            dicBP.set(v, item); //key=EdGraph, value=parent bp
                                        })

                                        //if(list.Children && list.Children.length > 1){
                                        if(!list.IsItemExpanded(item)){
                                            // list.SetSingleExpandedItem(item)
                                        }
                                        //    list.SetSingleExpandedItem(item)
                                        //}
                                        
                                    },
                                    $link:(elem:JavascriptTreeView)=>{
                                            elem.JavascriptContext = Context
                                            elem.Items = targetBPs;
                                            elem.Items.forEach(v => {
                                                elem.SetItemExpansion(v, true)
                                            });

                                            (<any>elem).proxy = {
                                                OnSelectionChanged:(item:UObject, type:ESelectInfo) =>{
                                                    
                                                    if(item instanceof Blueprint){
                                                        graphView.SetGraph(null);
                                                        return;
                                                    }

                                                    let graph = item as JavascriptGraphEdGraph;
                                                    //if(!graph.Schema){
                                                    //    setSchema(graph);
                                                    //}

                                                    graphView.SetGraph(graph)
                                                    console.log("set graph")
                                                    
                                                    let parent = graphView.GetParent();

                                                    //console.log(JSON.stringify(parent.SlotAsHorizontalBoxSlot()))

                                                    

                                                    //replacing EdGraph view
                                                    parent.RemoveChild(graphView);
                                                    //parent.ForceLayoutPrepass()
                                                    parent.AddChild(graphView);

                                                    

                                                    


                                                    
                                                    
                                                    //;(<any>graphView).$update()

                                                }
                                            };

                                            elem.SetSingleExpandedItem(elem.Items[0])

                                            
                                    },
                                    $unlink:()=>{

                                    }
                                })
                            ),
                            
                            /*
                            UMG(Button,
                                {
                                    OnClicked: (elem:Button)=>{
                                        graphView.CommandList
                                    },
                                    ColorAndOpacity:btnFColor
                                },
                                UMG.text({Font:btnFont},"Obfuscate!")
                            )*/
                        ),
                        UMG.div(
                            {
                                Slot:{
                                    Size:{
                                        Value:0.8,
                                        SizeRule: ESlateSizeRule.Fill,
                                        VerticalAlignment: EVerticalAlignment.VAlign_Fill,
                                        Padding:5
                                    }
                                } as any,
                            },                            
                            UMG(JavascriptMultiBox,{
                                //"CommandList":graphView.CommandList,
                                
                                OnHook:(id:string, elem:JavascriptMultiBox,builder:JavascriptMenuBuilder
                                )=>{
                                    console.log("Multibox - id:", id)

                                    //if(id=="Main"){
                                    JavascriptMenuLibrary.CreateToolbarBuilder(
                                        commandList,
                                        EOrientation.Orient_Horizontal,
                                        <any>((b:JavascriptMenuBuilder)=>{
                                            //elem.AddSubMenu(builder, "Option", "Option","...", true)
                                            //elem.AddPullDownMenu(builder,'Sub',"SUB","SUB")

                                            //b.BeginSection("Edit")
                                            //b.AddToolBarButton(
                                            //    commands.GetAction("Save")
                                            //)
                                            //b.EndSection()


                                            b.BeginSection("Obfuscate")
                                            
                                            b.AddToolBarButton(
                                                commands.CommandInfos[CmdNum.Obfuscate]
                                            )

                                            let cmx = new JavascriptComboButtonContext
                                            cmx.OnGetTooltip = <any>(()=>"option")
                                            cmx.OnGetWidget = <any>(()=>{

                                                //return I(UMG.text({},"test")).TakeWidget()   
                                                return I(UMG(JavascriptMultiBox,
                                                {OnHook:(id2:string, ele:JavascriptMultiBox, b3:JavascriptMenuBuilder)=>{
                                                    console.log("mb2",id2)
                                                    //if(id2=="Main"){
                                                    JavascriptMenuLibrary.CreateMenuBuilder(commandList,false, <any>((b2:JavascriptMenuBuilder)=>{
                                                        b2.PushCommandList(commandList)
                                                        b2.BeginSection("Layout")
                                                        b2.AddWidget(I(UMG.text({Font:menuFont},"Layout")),"",true)
                                                        //ele.AddPullDownMenu(b2,"Test","test","test...")
                                                        //ele.AddPullDownMenu(b3,"Test2","test2","test2...")
                                                        //ele.AddSubMenu(b3,"sub","sub","sub...",false)
                                                        b2.AddToolBarButton(commands.CommandInfos[CmdNum.Random])
                                                        b2.AddToolBarButton(commands.CommandInfos[CmdNum.Shrink])
                                                        
                                                        b2.EndSection()

                                                        //b2.AddSeparator()

                                                        
                                                        

                                                        b2.BeginSection("Removing")

                                                        b2.AddWidget(I(UMG.text({Font:menuFont},"Removing")),"",true)

                                                        b2.AddToolBarButton(commands.CommandInfos[CmdNum.RemoveCommentNode])
                                                        
                                                        b2.AddToolBarButton(commands.CommandInfos[CmdNum.RemoveCommentBubble])
                                                        
                                                        
                                                        b2.EndSection()

                                                        b2.BeginSection("Rename")

                                                        b2.AddWidget(I(UMG.text({Font:menuFont},"Rename")),"",true)

                                                        b2.AddToolBarButton(commands.CommandInfos[CmdNum.RenameVariable])
                                                        b2.AddToolBarButton(commands.CommandInfos[CmdNum.RenameFunction])
                                                        b2.AddToolBarButton(commands.CommandInfos[CmdNum.RenameMacro])
                                                        
                                                        
                                                        b2.EndSection()

                                                        JavascriptMultiBox.Bind(b2)
                                                
                                                    }))
                                                    //}
                                                }})).TakeWidget()

                                            })

                                            b.AddComboButton(
                                                cmx
                                            )
                                            b.EndSection()
                                            
                                            JavascriptMultiBox.Bind(b)
                                        })
                                    )
                                }
                            }),
                            UMG(Border,
                                {
                                    Slot:{
                                        /*
                                        Size:{
                                            Value:0.7,
                                            SizeRule: ESlateSizeRule.Fill,
                                            
                                        }*/
                                    },
                                    'slot.size.size-rule' : ESlateSizeRule.Fill,
                                    VerticalAlignment: EVerticalAlignment.VAlign_Fill,
                                    Background: editorStyle.GetBrush('ProjectBrowser.Background')
                                },

                                UMG(JavascriptGraphEditorWidget,
                                {
                                    AppearanceInfo:{
                                        CornerText:"BP Obfuscator",
                                        InstructionText:"Select any node graph"                                    
                                    },
                                    $link: (elem:JavascriptGraphEditorWidget) => {
                                        //elem.SetGraph(bp.UbergraphPages[0] as JavascriptGraphEdGraph)
                                        graphView = elem;
                                        
                                        //setCommands(graphView)
                                        //elem.SetGraph(JavascriptGraphEditorWidget.NewGraph(new UObject()))
                                        
                                        //console.log("graph!", JSON.stringify(elem))
                                        elem.SelectObject(elem, true)
                                        

                                        
                                        //*
                                        listeners.push(elem);
                                        //*/
                                    },
                                    $unlink: (elem:JavascriptGraphEditorWidget)=>{
                                        elem.Slot.Content = null;
                                        //listeners.splice(listeners.indexOf(elem),1)
                                    }
                                })
                            )
                        )
                    )
                )
                
                //tm2
            )
        )
        console.log("tab spawn!!")
    }
    setCommands(graphView);
    mkTab(tabManager)
    toolBtnStyle.Register()

    /* --------------------------------
     * Functions
     * 
     * -------------------------------*/

     //unused
    function setSchema(graph:EdGraph){
        class MySchema extends JavascriptGraphAssetGraphSchema{}
        let MySchama_C = require("uclass")()(global, MySchema)
        let schema:JavascriptGraphAssetGraphSchema = MySchama_C.GetDefaultObject();
        graph.Schema = MySchama_C;

        schema.OnBuildMenu = <any>((builder:JavascriptMenuBuilder) => {
            console.log("builder", JSON.stringify(builder))

            builder.BeginSection("Hello");
                builder.AddToolBarButton(JavascriptMenuLibrary.GenericCommand("Undo"));
                builder.AddToolBarButton(JavascriptMenuLibrary.GenericCommand("Redo"));
                builder.EndSection();
        })
    }

    function makeCommand(
        Id:string, 
        ActionType:EJavasrciptUserInterfaceActionType = EJavasrciptUserInterfaceActionType.Button,
        FriendlyName:string = Id,
        Description?:string,
        DefaultChord?:InputChord,
        CommandInfo?:JavascriptUICommandInfo,
        
    ){
        let newCmd = new JavascriptUICommand()
        newCmd.ActionType = ActionType;
        newCmd.FriendlyName = FriendlyName
        newCmd.Id = Id
        newCmd.CommandInfo = CommandInfo ? CommandInfo : new JavascriptUICommandInfo();
        newCmd.Description = Description
        newCmd.DefaultChord = DefaultChord

        return newCmd;
    }

    

    
    function setCommands(graphView:JavascriptGraphEditorWidget){
        let context = JavascriptMenuLibrary.NewBindingContext('BP_Obfuscator', 'Menu', '', ButtonStyleName);
        let cmds = new JavascriptUICommands()

        function init() {
            cmds.BindingContext = context;

            let doObf = new JavascriptUICommand()
            doObf.ActionType = EJavasrciptUserInterfaceActionType.Button;
            doObf.FriendlyName = "Obfuscate"
            doObf.Id = "Obfuscate"
            doObf.CommandInfo = new JavascriptUICommandInfo();
            doObf.Description = "Obfuscate ( Hard to read ) a selected graph nodes."

            let optLayoutRandom = new JavascriptUICommand()
            optLayoutRandom.ActionType = EJavasrciptUserInterfaceActionType.RadioButton;
            optLayoutRandom.FriendlyName = "Random"
            optLayoutRandom.Id = "Random"
            optLayoutRandom.Description = "random move nodes"
            optLayoutRandom.CommandInfo

            let optLayoutShrink = new JavascriptUICommand()
            optLayoutShrink.ActionType = EJavasrciptUserInterfaceActionType.RadioButton;
            optLayoutShrink.FriendlyName = "Shrink"
            optLayoutShrink.Id = "Shrink"
            optLayoutShrink.Description = "Shrink nodes"

            //not use
            let editSave = makeCommand(
                "Save",
                EJavasrciptUserInterfaceActionType.Button,
                "Save Graph",
                "Save Obfuscated graph"
            )

            let optRemoveCommnetNode = makeCommand(
                "RemoveCommentNode",
                EJavasrciptUserInterfaceActionType.ToggleButton,
                "Comment Nodes",
                "Remove all comment node"
            )

            let optRemoveCommnetBubble = makeCommand(
                "RemoveCommentBubble",
                EJavasrciptUserInterfaceActionType.ToggleButton,
                "Comment Bubble Texts",
                "Remove all comment bubble texts"
            )

            let optRenameFunction = makeCommand(
                "RenameFunction",
                EJavasrciptUserInterfaceActionType.ToggleButton,
                "Rename function names",
                "Rename BP function names"
            )

            let optRenameMacro = makeCommand(
                "RenameMacro",
                EJavasrciptUserInterfaceActionType.ToggleButton,
                "Rename macro names",
                "Rename macro names"
            )

            let optRenameVariable = makeCommand(
                "RenameVariable",
                EJavasrciptUserInterfaceActionType.ToggleButton,
                "Rename Variables",
                "Rename Varialbles"
            )

            cmds.Commands = [
                doObf,
                optLayoutRandom,
                optLayoutShrink,
                optRemoveCommnetNode,
                optRemoveCommnetBubble,
                optRenameVariable,
                optRenameFunction,
                optRenameMacro
            ]


            cmds.OnExecuteAction = <any>((id:string) =>{
                console.log("id", id)
                switch(id){
                    case "Obfuscate":{
                        Obfuscate();
                        break;
                    }
                    case "Random":{
                        currentLayoutOption = EObfuscateLayoutMode.Random
                        break;
                    }
                    case "Shrink":{
                        currentLayoutOption = EObfuscateLayoutMode.Shrink
                        break;
                    }
                    case "Save":{
                        break;
                    }
                    case "RemoveCommentNode":{
                        isRemovingCommentNode = !isRemovingCommentNode
                        break;
                    }
                    case "RemoveCommentBubble":{
                        isRemovingCommentBubble = !isRemovingCommentBubble
                        console.log("isRemovingCommentBubble",isRemovingCommentBubble)
                        break;
                    }
                    case CmdNum[CmdNum.RenameVariable]:{
                        isRename[CmdNum.RenameVariable] = !isRename[CmdNum.RenameVariable];
                        break;
                    }
                    case CmdNum[CmdNum.RenameFunction]:{
                        isRename[CmdNum.RenameFunction] = !isRename[CmdNum.RenameFunction];
                        break;
                    }
                    case CmdNum[CmdNum.RenameMacro]:{
                        isRename[CmdNum.RenameMacro] = !isRename[CmdNum.RenameMacro];
                        break;
                    }
                    default:{
                        //do nothing
                    }
                }
            })
            /** */
            cmds.OnCanExecuteAction = <any>((id:string) => {
                return true
            })
            /**/

            cmds.OnIsActionButtonVisible = <any>((id:string) => {
                return true
            })

            cmds.OnIsActionChecked = <any>((id:string)=>{
                switch(id){
                    //case "Obfuscate":return false;
                    case "Random":
                        return currentLayoutOption == EObfuscateLayoutMode.Random;
                    case "Shrink":
                        return currentLayoutOption == EObfuscateLayoutMode.Shrink;
                    case "RemoveCommentNode":
                        return isRemovingCommentNode;
                    case "RemoveCommentBubble":
                        return isRemovingCommentBubble;
                    case CmdNum[CmdNum.RenameVariable]:
                        return isRename[CmdNum.RenameVariable];
                    case CmdNum[CmdNum.RenameFunction]:
                        return isRename[CmdNum.RenameFunction];
                    case CmdNum[CmdNum.RenameMacro]:
                        return isRename[CmdNum.RenameMacro];
                    default:
                        return false;
                }
            })

            cmds.Initialize();
        }

        function uninit() {
            cmds.Uninitialize();
            context.Destroy();
        }

        init();
        (<any>cmds).destroy = uninit;

        let graphCmd = JavascriptMenuLibrary.CreateUICommandList()
        cmds.Bind(graphCmd)

        commands = cmds;
        commandList = graphCmd
    }


    

    /**
     * Obfuscate graph nodes
     * 
     */
    function Obfuscate(){
        let g = graphView.EdGraph;  //current selected graph

        if(!g)return;

        let outer = g.GetOuter()

        //undo
        
        
        //undo transaction
        //https://github.com/ncsoft/Unreal.js/wiki/Playing-within-editor
        $execTransaction(`Obfuscate ${outer.GetName()}.${g.GetName()} : BP Obfuscator`,()=>{
            
            
            g.ModifyObject(true)
            g.CreateCopyForUndoBuffer()
            g.Nodes.forEach(v => v.ModifyObject(true))  //this line must be required.
            g.Nodes.forEach(v => v.CreateCopyForUndoBuffer())
            
            //graphView.ModifyObject(true)
            
            

            console.log("has undo", GEngine.HasUndo())  //true

            

            //TODO: async await

            //layout
            g = obfuscateLayout(g, currentLayoutOption);

            //remove all comment node
            //TODO
            if(isRemovingCommentNode){
                g.Nodes = g.Nodes.filter( v => {
                    console.log("node is", v.GetName())
                    return !(v instanceof EdGraphNode_Comment)
                }
                )
            }

            //remove all comment bubble text
            if(isRemovingCommentBubble)removeAllCommentBubbles(g)


            //set dirty
            
            //g.Nodes.forEach(v => v.PostEditChange())
            g.PostEditChange();
            g.MarkPackageDirty()



            for(let i=0; i<GEngine.Trans.GetQueueLength();i++){
                let tr = GEngine.Trans.GetTransaction(i);
                console.log(
                    "transactions:",
                    //GEngine.Trans.GetQueueLength(),
                    //Transactor.IsActive(GEngine.Trans),
                    tr.GetTitle(),",",
                    tr.GetContext(),",",
                    tr.GetPrimaryObject()
                )
            }
        });

        
    }

    function obfuscateLayout(g:JavascriptGraphEdGraph, opt:EObfuscateLayoutMode){
        let mode:EObfuscateLayoutMode;
        //mode = EObfuscateMode.Random;
        mode = opt;
        switch(mode){
            case EObfuscateLayoutMode.Random:{

                g.Nodes.forEach(v =>{
                    v.NodePosX = Math.random() * 1000;
                    v.NodePosY = Math.random() * 1000;
                })

                break;
            }
            case EObfuscateLayoutMode.Shrink:{

                g.Nodes.forEach(v => {
                    v.NodePosX = v.NodePosY = 0;
                })

                break;
            }
            default:{
                throw Error(`Obfuscate mode "${mode}" is unknown.`)
                
            }
        }
        return g;
    }

    function removeAllCommentNodes(g:JavascriptGraphEdGraph){

        g.Nodes.map((v, i, a)=>{
            //console.log("node is", typeof v)
            if(v instanceof EdGraphNode_Comment){
                //console.log(typeof v)
                v.DestroyNode()
            }
        })

        return g;
    }

    function removeAllCommentBubbles(g:JavascriptGraphEdGraph){

        g.Nodes.forEach(v => {
            v.bCommentBubblePinned = false;
            v.bCommentBubbleVisible = false //need this line; stop undo buffer increasing 
            v.NodeComment = ""
        })

    }
     


    return ()=>{
        //clean up
        
        (<any>global).editorGroup = null;
        (<any>global).tabGroup = null;
        (<any>commands).destroy()
        toolBtnStyle.Unregister()
        console.log("clear!")
        return;
    }
}

// bootstrap to initiate live-reloading dev env.
try {
    module.exports = () => {
        let cleanup:Function|null = null

        // wait for map to be loaded.
        process.nextTick(() => cleanup = main());

        // live-reloadable function should return its cleanup function
        return () => cleanup()
    }
}
catch (e) {
    
    bootstrap('extension-test')
}