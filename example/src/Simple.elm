module Main exposing (..)

import Html.App as Html
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Dict exposing (..)
import Date exposing (..)
import EventSource exposing (..)
import Json.Decode
import Json.Decode.Pipeline as JD


-- Model


type alias Url =
    String


type alias DatasetId =
    Int


type alias Event =
    { dataset : DatasetId
    , date : Date.Date
    }


type alias Channel =
    { events : List (Result String Event)
    , listening : Bool
    }


type ChannelMsg
    = Receive (Result String Event)
    | ToggleListening
    | Clear


type alias Model =
    { eventRoot : Url
    , channels : Dict DatasetId Channel
    }


emptyModel : Model
emptyModel =
    { eventRoot = "http://localhost:3000"
    , channels = Dict.empty
    }



-- Update


init : ( Model, Cmd Msg )
init =
    emptyModel ! []


type Msg
    = ChannelMsg DatasetId ChannelMsg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ChannelMsg datasetId submsg ->
            let
                updater =
                    Maybe.map (updateChannel submsg)
            in
                ( { model
                    | channels =
                        Dict.update datasetId
                            updater
                            model.channels
                  }
                , Cmd.none
                )


updateChannel : ChannelMsg -> Channel -> Channel
updateChannel msg channel =
    case msg of
        Receive event ->
            { channel | events = List.take 25 <| event :: channel.events }

        ToggleListening ->
            { channel | listening = not channel.listening }

        Clear ->
            { channel | events = [] }



-- Decoder


decodeEvent : Json.Decode.Decoder Event
decodeEvent =
    JD.decode Event
        |> JD.required "dataset" Json.Decode.int
        |> JD.required "date" (Json.Decode.map (toFloat >> Date.fromTime) Json.Decode.int)


listen : Url -> DatasetId -> Sub Msg
listen eventRoot datasetId =
    EventSource.listen (eventRoot ++ "/public/events/datasets/" ++ (toString datasetId))
        (Json.Decode.decodeString decodeEvent >> Receive >> ChannelMsg datasetId)



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    model.channels
        |> Dict.filter (\_ channel -> channel.listening)
        |> Dict.map (\key val -> (listen model.eventRoot key))
        |> Dict.values
        |> Sub.batch



-- View


view : Model -> Html Msg
view model =
    div [] [ text "Server sent events:" ]



-- Main program


app =
    Html.program
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }
