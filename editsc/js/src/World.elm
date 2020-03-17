module World exposing (World, GameMode(..), PlayerType(..))

import Vector3 exposing (Vector3)
import Vector4 exposing (Vector4)

import Blocks exposing (BlockDataEntry)



type alias World =
    { config : WorldConfig
    , entities : List (Entity {})
    , blockdata : List BlockDataEntry
    , currentVersion : GameVersion
    , guid : String
    }



type alias WorldConfig =
    { worldName : String
    , originalVersion : GameVersion
    , gameMode : GameMode
    , staticEnvironment : Bool
    , timeOfDay : TimeOfDayMode
    , weatherEffects : Bool
    , adventureRespawnAllowed : Bool
    , adventureSurvivalMechanics : Bool
    , supernaturalCreatures : Bool
    , friendlyFire : Bool
    , seedString : String
    , terrainIsland : Bool
    , terrainFlat : Bool
    , islandSize : IslandSize
    , terrainHeight : Int
    , shoreRoughness : Float
    , terrainBlock : BlockType
    , oceanBlock : BlockType
    , tempOffset : Float
    , humidityOffset : Float
    , seaLevel : Int
    , biomeScale : Float
    , startPositionDifficulty : StartPositionDifficulty
    , textureFileName : String
    , colorPallete : List WorldColor
    , seed : Int
    , elapsedTime : Float
    }


type GameVersion
    = GameVersion Int Int

type GameMode
    = Cruel
    | Adventure
    | Challenging
    | Harmless
    | Creative

type TimeOfDayMode
    = Changing
    | Day
    | Night
    | Sunrise
    | Sunset

type IslandSize = IslandSize Int Int

type BlockType = BlockType Int

type StartPositionDifficulty
    = Easy
    | Medium
    | Hard

type alias WorldColor =
    { index : Int
    , name : String
    , red : Int
    , green : Int
    , blue : Int
    }



type alias Entity a =
    { a
    | guid : String
    , position : Vector3 Float
    , rotation : Vector4 Float -- should be a quaternion
    , velocity : Vector3 Float
    , spawnTime : Float
    , fireDuration : Float
    }


type alias Alive a = -- Players and animals
    Entity
    { a
    | health : Float
    , air : Float
    , creativeFlyEnabled : Bool
    , constantSpawn : Bool
    }


type alias Animal a =
    Alive
    { a
    | lootDropped : Bool
    , animalType : AnimalType
    }


type alias Player a =
    Alive
    { a
    | playerId : Int
    , playerType : PlayerType
    , sleepStartTime : Float
    , allowManualWakeup : Bool
    , clothing : BodyClothing
    , fluDuration : Float
    , fluOnset : Float
    -- , inventorySlots : TODO, might only be used in survival worlds
    , activeInventorySlot : Int
    , playerIntro : Bool
    , sicknessDuration : Float
    , keyboardHelpShown : Bool
    , gamepadHelpShown : Bool
    -- , furnitureInventorySet : String TODO
    , foodLevel : Float
    , stamina : Float
    , sleepLevel : Float
    , temperature : Float
    , wetness : Float
    -- , satiation : TODO, i don't know what the f**k this is
    -- , creativeInventory : TODO
    -- , craftingTableSlots : TODO
    }


type alias BodyClothing =
    { head : String
    , torso : String
    , legs: String
    , feet: String
    }


type PlayerType
    = Male
    | Female


type AnimalType
    = Seagull
    | Duck
    | Raven
    | Wildboar
    | Bull AnimalColor
    | Cow AnimalColor
    | Wolf
    | Coyote
    | Bear AnimalColor
    | Horse
    | Camel
    | Giraffe
    | Zebra
    | Rhino
    | Lion
    | Tiger AnimalColor
    | Jaguar
    | Leopard
    | Reindeer
    | Moose
    | Bison
    | Donkey
    | Cassowary
    | Ostrich
    | Hyena
    | Gnu
    | Werewolf
    | FreshwaterBass
    | SeaBass
    | Ray AnimalColor
    | Barracuda
    | BullShark
    | TigerShark
    | GreatWhiteShark
    | Piranha
    | Orca
    | BelugaWhale

type AnimalColor
    = Black
    | Brown
    | White
    | Yellow
    | NormalColor
