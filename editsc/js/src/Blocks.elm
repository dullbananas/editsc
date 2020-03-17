module Blocks exposing (BlockDataEntry)


import Vector3 exposing (Vector3)



type BlockDataEntry
    = Block (Vector3 Int) BlockData
    | Item Int BlockData



type BlockData
    = MemoryBank (List Int) Int -- List of bytes and the current output
    | Explosive Float -- Time until explosion
    | LeavesToCheck
    | Sign (List SignLine) (Maybe String) -- list of lines and url
    | Magnet
    | TruthTable (List Int) -- List of voltages
    -- All block types below are stored as block entities
    | CraftingTable (List InventoryItem)
    {-
    TODO:
    | Sappling
    -}


type alias SignLine =
    { content : String
    , color : Maybe (Vector3 Int)
    }


type alias InventoryItem = -- inventory can be in chest, furnace, etc.
    { value : Int
    , count : Int
    }
