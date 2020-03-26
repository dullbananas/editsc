module World.BlockType exposing
    ( BlockType
    , fromInt
    )


type BlockType
    = BlockType Int


fromInt : Int -> Maybe BlockType
fromInt index =
    if (index > 0) && (index < 255) then
        Just (BlockType index)
    else
        Nothing


toInt : BlockType -> Int
toInt blockType =
    case blockType of
        BlockType value -> value
