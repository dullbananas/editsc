module Editsc.Model.Editor exposing
    ( Model
    , Msg
    , init
    , update
    , subscriptions
    , view
    )

import Browser.Events
import Editsc.Viewport as Viewport exposing (Viewport)
import Html exposing (Html, Attribute)
import Html.Attributes as Attr
import Task exposing (Task)


type Model
    = Model
        { viewport : Viewport
        }


type Msg
    = GotViewport Viewport
    | FramePassed Float


init : () -> (Model, Cmd Msg)
init flags =
    ( Model
        { viewport = Viewport.default
        }
    , Task.perform GotViewport Viewport.get
    )


update : Msg -> Model -> (Model, Cmd Msg)
update msg (Model model) =
    case msg of
        GotViewport viewport ->
            ( Model
                { model
                | viewport = viewport
                }
            , Cmd.none
            )

        FramePassed milliseconds ->
            ( Model model
            , Cmd.batch
                [ Task.perform GotViewport Viewport.get
                ]
            )


subscriptions : Model -> Sub Msg
subscriptions (Model model) =
    Sub.batch
        [ Browser.Events.onAnimationFrameDelta FramePassed
        ]


view : Model -> List (Html Msg)
view (Model model) =
    [ viewCanvas model.viewport
    ]


viewCanvas : Viewport -> Html Msg
viewCanvas viewport =
    let
        width = Viewport.width viewport
        height = Viewport.height viewport
    in
    Html.img
        [ Attr.width (width identity)
        , Attr.height (height identity)
        , Attr.src "https://carolinanewsandreporter.cic.sc.edu/wp-content/uploads/2018/11/FallingNug1.jpg"
        ] []
