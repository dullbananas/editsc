module World.Entity exposing
    ( Entity
    , Alive
    , Animal
    , PlayerBodyStats
    , BodyClothing
    , AnimalType
    )

import GameTypes exposing (..)


type Entity
    = Player PlayerData ( EntityData Alive )


type alias EntityData a =
    { a
    | guid : String
    , position : Vector3
    , rotation : Quaternion
    , velocity : Vector3
    , spawnTime : Float
    , fireDuration : Float
    }


type alias Alive =
    { health : Float
    , air : Float
    , creativeFlying : Bool
    , constantSpawn : Bool
    }


type alias PlayerData =
    { id : Int
    , stats : PlayerStats
    }


type alias PlayerStats =
    {}


type Component
    = Locomotion
        { creativeFlying : Bool }



-- v OLD v


type alias Animal a =
    --Alive
    { a
    | lootDropped : Bool
    , animalType : AnimalType
    }


{-type alias Player a =
    Alive
    { a
    | playerId : Int
    , playerClass : PlayerClass
    , allowManualWakeup : Bool
    , clothing : BodyClothing
    -- , inventorySlots : TODO, might only be used in survival worlds
    , activeInventorySlot : Int
    , playerIntro : Bool
    , keyboardHelpShown : Bool
    , gamepadHelpShown : Bool
    -- , furnitureInventorySet : String TODO
    -- , satiation : TODO, i don't know what the f**k this is
    -- , creativeInventory : TODO
    -- , craftingTableSlots : TODO
    }
-}


type alias PlayerBodyStats =
    { foodLevel : Float
    , stamina : Float
    , sleepLevel : Float
    , sleepStartTime : Float
    , temperature : Float
    , wetness : Float
    , sicknessDuration : Float
    , fluDuration : Float
    , fluOnset : Float
    }


type alias BodyClothing =
    { head : String
    , torso : String
    , legs: String
    , feet: String
    }


type AnimalType
    = Barracuda
    | BelugaWhale
    | Bison
    | BlackBear
    | BlackBull
    | BlackCow
    | BrownBear
    | BrownBull
    | BrownCow
    | BrownRay
    | BullShark
    | Camel
    | Cassowary
    | Coyote
    | Donkey
    | Duck
    | FreshwaterBass
    | Giraffe
    | Gnu
    | GreatWhiteShark
    | Horse
    | Hyena
    | Jaguar
    | Leopard
    | Lion
    | Moose
    | Orca
    | Ostrich
    | Piranha
    | PolarBear
    | Raven
    | Reindeer
    | Rhino
    | SeaBass
    | Seagull
    | Tiger
    | TigerShark
    | Werewolf
    | WhiteBull
    | WhiteTiger
    | Wildboar
    | Wolf
    | YellowRay
    | Zebra
