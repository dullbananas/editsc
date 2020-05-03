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
    , Vector3
    , Quaternion
    , Point3
    , PaletteColor
    , PaletteEntry
    , Long(..)
    , Double(..)
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


type alias Vector3 =
    { x : Float
    , y : Float
    , z : Float
    }


type alias Quaternion =
    { w : Float
    , x : Float
    , y : Float
    , z : Float
    }


type alias Point3 =
    { x : Int
    , y : Int
    , z : Int
    }


type alias PaletteEntry =
    { color : Maybe PaletteColor
    , name : String
    }


type alias PaletteColor =
    { red : Int
    , green : Int
    , blue : Int
    }


-- TODO: make these types able to hold large values


type Long
    = Long Int


type Double
    = Double Float
