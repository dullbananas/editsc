module GameTypes exposing
    ( PlayerType(..)
    , GameMode(..)
    )

{-| This module defines types that are used by both the `World` and `ProjectFile`
modles. It was created to fix an import cycle with these modules.
-}


type PlayerType
    = Male
    | Female


type GameMode
    = Cruel
    | Adventure
    | Challenging
    | Harmless
    | Creative
