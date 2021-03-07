module Editsc.Viewport exposing
    ( Viewport
    , default
    , get
    , width
    , height
    )

import Browser.Dom
import Task exposing (Task)


type Viewport
    = Viewport
        { width : Float
        , height : Float
        }


default : Viewport
default =
    Viewport
        { width = 0
        , height = 0
        }


get : Task x Viewport
get =
    Browser.Dom.getViewport
        |> Task.map
            ( \{viewport} ->
                Viewport
                    { width = viewport.width
                    , height = viewport.height
                    }
            )


getter : (Viewport -> Float) -> Viewport -> (Float -> Float) -> Int
getter field viewport transform =
    (field >> transform >> Basics.floor) viewport


width : Viewport -> (Float -> Float) -> Int
width =
    getter (\(Viewport v) -> v.width)


height : Viewport -> (Float -> Float) -> Int
height =
    getter (\(Viewport v) -> v.height)
