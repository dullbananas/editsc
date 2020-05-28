module TestWorld exposing (suite)

import Expect exposing (Expectation)
import Test exposing (..)

import Result.Extra as ResultE

import ProjectFile.XmlItem as X exposing (XmlItem(..), Value, Values)
import ProjectFile exposing (ProjectFile)
import World exposing (World)
import World.GameVersion as GameVersion
import World.BlockType as BlockType exposing (BlockType)
import GameTypes exposing (..)


suite : Test
suite =
    describe "World"
        {-[ test "From valid project file" <| \_ ->
            projectFile
                |> World.fromProjectFile
                |> Expect.equal (Ok world)

        , test "To project file" <| \_ ->
            world
                |> World.toProjectFile
                |> sortProjectFile
                |> Expect.equal ( sortProjectFile projectFile )
        ]-}
        [ test "To and from project file" <| \_ ->
            world
                |> World.toProjectFile
                |> World.fromProjectFile
                |> Expect.equal ( Ok world )
        ]



{-| This function sorts the values in a project file by their names. This
prevents the test from failing because of values being in different orders.
-}

{-sortProjectFile : ProjectFile -> ProjectFile
sortProjectFile { subsystems, entities, version, guid } =
    { subsystems = sortXmlItems subsystems
    , entities = entities
    , version = version
    , guid = guid
    }


sortXmlItems : List XmlItem -> List XmlItem
sortXmlItems =
    List.map sortChildren >> List.sortBy getName-}


--{-| Sorts an XmlItem's children if it's MultiValues, otherwise acts like identity
---}

{-sortChildren : XmlItem -> XmlItem
sortChildren xmlItem =
    case xmlItem of
        OneValue _ ->
            xmlItem

        MultiValues { name, children } ->
            MultiValues
                { name = name
                , children = sortXmlItems children
                }


getName : XmlItem -> String
getName xmlItem =
    case xmlItem of
        OneValue vv ->
            vv.name

        MultiValues vv ->
            vv.name-}



mv : String -> List XmlItem -> XmlItem
mv name content =
    MultiValues <| Values name content

v : String -> String -> String -> XmlItem
v name typename value =
    OneValue <| Value name typename value


projectFile : ProjectFile
projectFile =
    { subsystems =
        [ mv "PlayerStats"
            [ mv "Stats"
                []
            ]
        , mv "Players"
            [ v "GlobalSpawnPosition " "Vector3" "1,2,3"
            ]
        , mv "GameInfo"
            [ v "WorldName" "string" "Good World"
            , v "OriginalSerializationVersion" "string" "2.2"
            , v "EnvironmentBehaviorMode" "Game.EnvironmentBehaviorMode" "Living"
            , v "GameMode" "Game.GameMode" "Creative"
            , v "TimeOfDayMode" "Game.TimeOfDayMode" "Changing"
            , v "AreWeatherEffectsEnabled" "bool" "True"
            , v "IsAdventureRespawnAllowed" "bool" "True"
            , v "AreAdventureSurvivalMechanicsEnabled" "bool" "False"
            , v "AreSupernaturalCreaturesEnabled" "bool" "False"
            , v "IsFriendlyFireEnabled" "bool" "False"
            , v "WorldSeedString" "string" "ryl"
            , v "TerrainGenerationMode" "Game.TerrainGenerationMode" "FlatContinent"
            , v "IslandSize" "Vector2" "400,400"
            , v "TerrainLevel" "int" "64"
            , v "ShoreRoughness" "float" "0.5"
            , v "TerrainBlockIndex" "int" "0"
            , v "TerrainOceanBlockIndex" "int" "0"
            , v "TemperatureOffset" "float" "0"
            , v "HumidityOffset" "float" "0"
            , v "SeaLevelOffset" "int" "0"
            , v "BiomeSize" "float" "1"
            , v "StartingPositionMode" "Game.StartingPositionMode" "Easy"
            , v "BlockTextureName" "string" ""
            , mv "Palette"
                [ v "Colors" "string" ";0,255,255;255,0,255;;;;;;;;;;;;;"
                , v "Names" "string" ";;;;;;;;;;;;;;;"
                ]
            , v "WorldSeed" "int" "10116"
            , v "TotalElapsedGameTime" "double" "10"
            ]
        , mv "Weather"
            [ v "WeatherStartTime" "double" "123.4"
            , v "WeatherEndTime" "double" "567.8"
            , v "LightningIntensity" "float" "0"
            ]
        ]
    , entities = []
    , version = "2.2"
    , guid = "9e9a67f8-79df-4d05-8cfa-61bd8095661e"
    }


world : World
world =
    { currentVersion = GameVersion.latest
    , guid = "9e9a67f8-79df-4d05-8cfa-61bd8095661e"
    , config =
        { worldName = "Good World"
        , gameMode = Creative
        , adventureRespawnAllowed = True
        , adventureSurvivalMechanics = False
        , startPositionMode = Easy
        , textureFileName = ""
        , globalSpawn = Vector3 1 2 3
        , environment =
            { behavior = Living
            , supernaturalCreatures = False
            , friendlyFire = False
            , tempOffset = 0.0
            , humidityOffset = 0.0
            , timeOfDay = Changing
            , weatherEffects = True
            }
        , terrain =
            { seed = 10116
            , seedString = "ryl"
            , biomeSize = 1.0
            , seaLevel = 0
            , generationMode = FlatContinent
            , flat =
                { height = 64
                , landBlock = BlockType.air
                , oceanBlock = BlockType.air
                , shoreRoughness = 0.5
                }
            , islandSize = { northSouth = 400.0, eastWest = 400.0 }
            }
        , colorPalette =
            [ paletteNone
            , PaletteEntry ( Just <| PaletteColor 0 255 255 ) ""
            , PaletteEntry ( Just <| PaletteColor 255 0 255 ) ""
            ] ++ List.repeat 13 paletteNone
        }
    , state =
        { elapsedTime = doubleFromFloat 10.0
        , weather =
            { startTime = doubleFromFloat 123.4
            , endTime = doubleFromFloat 567.8
            , lightningIntensity = 0
            }
        }
    , originalVersion = GameVersion.latest
    , entities = []
    , playerStats = []
    }


paletteNone : PaletteEntry
paletteNone =
    { color = Nothing
    , name = ""
    }
