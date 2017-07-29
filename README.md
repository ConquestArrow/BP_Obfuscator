# BP_Obfuscator - A Simple Blueprint Obfuscating Tool

this tool is currently **WIP!!**

![img](./screenshot.png)

## requirement

+ [UnrealEngine](https://www.unrealengine.com/) 4.15 >=
+ [Unreal.js](https://github.com/ncsoft/Unreal.js) 0.2.7 >=

## install

+ Download [a latest release](https://github.com/ConquestArrow/BP_Obfuscator/releases)
+ Move files to your UE4 project `/Content/Scripts/`

## how to use

1. Select Blueprint assets
2. Select graph
3. Set option
4. Press `Obfuscate` button
5. If OK, save files by Content browser

### Options

* Layout
    * Random - randomize node location
    * Shrink - All nodes move to x:0, y:0
+ Remove
    + Comment nodes - Remove all comment node from selected graph
    + Comment Bubble text - Remove bubble comment text from all nodes

## build

+ TypeScript 2.3 >=
+ `cd /Content/Scripts/ & tsc`
