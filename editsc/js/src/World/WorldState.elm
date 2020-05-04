module World.WorldState exposing
    ( WorldState
    , Weather
    , fromProjectFile
    )

import Result.Extra as ResultE

import ProjectFile exposing (ProjectFile)
import ProjectFile.XmlItem as X exposing (XmlItem, thenQuery, query)
import GameTypes exposing (..)
import ConversionError exposing (ConversionError)


type alias WorldState =
    { elapsedTime : Double
    , weather : Weather
    }


fromProjectFile : ProjectFile -> Result ConversionError WorldState
fromProjectFile { subsystems } =
    Ok WorldState
        |> thenQuery X.double ["GameInfo", "TotalElapsedGameTime"] subsystems
        |> ResultE.andMap (weatherFromSubsystems subsystems)


type alias Weather =
    { startTime : Double
    , endTime : Double
    , lightningIntensity : Float
    }


weatherFromSubsystems : List XmlItem -> Result ConversionError Weather
weatherFromSubsystems subsystems =
    Ok Weather
        |> thenQuery X.double ["Weather", "WeatherStartTime"] subsystems
        |> thenQuery X.double ["Weather", "WeatherEndTime"] subsystems
        |> thenQuery X.float ["Weather", "LightningIntensity"] subsystems
