module GameTypes exposing
    ( PlayerClass(..)
    , GameMode(..)
    , StartingPositionMode(..)
    , EnvironmentBehavior(..)
    , TimeOfDayMode(..)
    , TerrainGenerationMode(..)
    , FurnitureInteraction(..)
    , WidgetInputDevice(..)
    , Vector2
    , Point3
    , PaletteColor
    )

{-| This module defines types that are used by both the `World` and `ProjectFile`
modles. It was created to fix an import cycle with these modules.
-}


type PlayerClass
    = Male
    | Female


type GameMode
    = Cruel
    | Adventure
    | Challenging
    | Harmless
    | Creative


type StartingPositionMode
    = Easy
    | Medium
    | Hard


type EnvironmentBehavior
    = Living
    | Static


type TimeOfDayMode
    = Changing
    | Day
    | Night
    | Sunrise
    | Sunset


type TerrainGenerationMode
    = Continent
    | Island
    | FlatContinent
    | FlatIsland


type FurnitureInteraction
    = NotInteractive
    | Multistate
    | ElectricSwitch
    | ElectricButton
    | ConnectedMultistate


type WidgetInputDevice
    = NoInputDevice
    | Gamepad1
    | Gamepad2
    | Gamepad3
    | Gamepad4


type alias Vector2 =
    { x : Float
    , y : Float
    }


type alias Point3 =
    { x : Int
    , y : Int
    , z : Int
    }


type alias PaletteColor =
    { index : Int
    , name : String
    , red : Int
    , green : Int
    , blue : Int
    }
