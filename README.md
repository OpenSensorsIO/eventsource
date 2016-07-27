# eventsource

Server Sent Events (SSE) ELM client library (using Javascript eventsource). Influenced heavilly from the Websocket library in elm-core.

## Installation

Currently this lib is not available on [package.elm-lang.org](http://package.elm-lang.org). So you need to clone and move the files into your project.

## Documentation

```elm
module DatasetEvents.Types exposing (..)

type alias Channel =
    { events : List (Result String Event)
    , listening : Bool
    }


type alias Model =
    { eventRoot : Url
    , channels : Dict DatasetId Channel
    }


type ChannelMsg
    = Receive (Result String Event)
    | ToggleListening
    | Clear

```


```elm
module DatasetEvents.Rest exposing (..)

import EventSource


decodeEvent : Decoder Event
decodeEvent =
    decode Event
        |> required "dataset" int
        |> required "date" (map (toFloat >> Date.fromTime) int)


listen : Url -> DatasetId -> Sub Msg
listen eventRoot datasetId =
    EventSource.listen (eventRoot ++ "/public/events/datasets/" ++ (toString datasetId))
        (decodeString decodeEvent >> Receive >> ChannelMsg datasetId)
```

```elm
module DatasetEvents.State exposing (..)

subscriptions : Model -> Sub Msg
subscriptions model =
    model.channels
        |> Dict.filter (\_ channel -> channel.listening)
        |> Dict.map (\key val -> Rest.listen model.eventRoot key val.typ)
        |> Dict.values
        |> Sub.batch


update : Msg -> Model -> Response Model Msg
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
```

## Contributors

With thanks to: [Kris Jenkins](https://github.com/krisajenkins), [Martin Trojer](https://github.com/martintrojer)

## License

Copyright © 2016 Opensensors.io

Distributed under the MIT license.
