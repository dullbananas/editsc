port module Filesystem exposing
    ( ls, lsSub, ChildList
    , mkdir
    )

import Db exposing (Db, Row)
import Id exposing (Id)
import Json.Encode as E
import Json.Decode as D

import Port


type alias ChildList =
    { files : List String
    , dirs : List String
    }
port lsSub : (ChildList -> msg) -> Sub msg


ls : List String -> Cmd msg
ls path =
    Port.send "ls"
        [ ("path", E.list E.string path)
        ]


mkdir : List String -> String -> Cmd msg
mkdir path name =
    Port.send "mkdir"
        [ ("path", E.list E.string path)
        , ("name", E.string name)
        ]
