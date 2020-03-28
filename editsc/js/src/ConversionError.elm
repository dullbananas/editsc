module ConversionError exposing
    ( ConversionError(..)
    , NodeErrType(..)
    )

import XmlParser exposing (Node)


type ConversionError
    = NodeError NodeErrType Node
    | QueryError (List String)
    | InvalidVersion


type NodeErrType
    = InvalidElementName
    | MissingAttributes
