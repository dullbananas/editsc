module World.Blocks exposing
    ( BlockDataEntry(..)
    , BlockData(..)
    , BlockValue
    , MemoryBankState
    , ExplosiveState
    , SignState
    , TruthTableState
    , CraftingTableState
    )

import Vector3 exposing (Vector3)
import Bitwise

import World.BlockType as BlockType exposing (BlockType)


type BlockValue
    = BlockValue Int


type BlockDataEntry
    = Block Int Int Int BlockData
    | Item Int BlockData


type BlockData
    = MemoryBank MemoryBankState
    | Explosive ExplosiveState
    | LeavesToCheck
    | Sign SignState
    | Magnet
    | TruthTable TruthTableState
    -- All block types below are stored as block entities
    | CraftingTable CraftingTableState
    {-
    TODO:
    | Sappling
    -}


getBlockType : BlockValue -> Maybe BlockType
getBlockType blockValue =
    case blockValue of
        BlockValue data ->
            Bitwise.and 0x3FF data
                |> BlockType.fromInt


type alias MemoryBankState =
    { bytes : List Int
    , currentOutput : Int
    }


type alias ExplosiveState =
    { timeUntilExplosion : Float
    }


type alias SignState =
    { line0 : SignLine
    , line1 : SignLine
    , line2 : SignLine
    , line3 : SignLine
    , url : String
    }


type alias TruthTableState =
    { voltage0000 : Int
    , voltage0001 : Int
    , voltage0010 : Int
    , voltage0011 : Int
    , voltage0100 : Int
    , voltage0101 : Int
    , voltage0110 : Int
    , voltage0111 : Int
    , voltage1000 : Int
    , voltage1001 : Int
    , voltage1010 : Int
    , voltage1011 : Int
    , voltage1100 : Int
    , voltage1101 : Int
    , voltage1110 : Int
    , voltage1111 : Int
    }


type alias CraftingTableState =
    { slot0 : ItemSlot
    , slot1 : ItemSlot
    , slot2 : ItemSlot
    , slot3 : ItemSlot
    , slot4 : ItemSlot
    , slot5 : ItemSlot
    , slot6 : ItemSlot
    , slot7 : ItemSlot
    , slot8 : ItemSlot
    }


type alias SignLine =
    { content : String
    , color : Maybe (Vector3 Int)
    }


type alias ItemSlot =
    { value : BlockValue
    , count : Int
    }
