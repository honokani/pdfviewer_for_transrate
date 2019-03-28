module PdfTranse exposing (Flags, Model, Msg, program)

-- common modules
import Browser              as Brs
import Browser.Navigation   as Nav
import Html                 as H      exposing (..)
import Html.Attributes                exposing (..)
import Html.Events                    exposing (onClick, onInput, onSubmit)
import Http
-- canvas
import Canvas               as Cnv    exposing (..)
import Color
--
import Port                 as P



type alias Flags = Maybe Int

type alias Model =
    { page: Int
    , url: String
    , history: List String
    }

type Msg
    = Undef
    | LoadPdf
    | ChangeUrl String
    | GotFocusedStr (Maybe String)
    | PageInc
    | PageDec



program : Program Flags Model Msg
program = Brs.document
    { init = init
    , update = update
    , subscriptions = subscriptions
    , view = view
    }


init : Flags -> (Model, Cmd Msg)
init mayP =
    let
        p = case mayP of
            Nothing -> 1
            Just i -> i
    in
        ( Model p "" []
        , Cmd.none
        )


subscriptions : Model -> Sub Msg
subscriptions mdl = Sub.batch
    [ P.sendFocusedStr GotFocusedStr
    ]



update : Msg -> Model -> (Model, Cmd Msg)
update msg mdl = case msg of
    Undef ->
        ( mdl, Cmd.none )
    LoadPdf ->
        let
            newM = { mdl | page = 1}
        in
            ( newM, P.loadPdfFile mdl.url )
    ChangeUrl s ->
        let
            newM = { mdl | url = s}
        in
            ( newM, Cmd.none )
    GotFocusedStr mayS -> case mayS of
        Just s ->
            let
                newM = { mdl | history = s :: mdl.history }
            in
                ( newM, Cmd.none)
        Nothing ->
            ( mdl, Cmd.none )
    PageInc ->
        let
            nP = mdl.page + 1
            newM = { mdl | page = nP }
        in
            ( newM, P.pageIncrease nP )
    PageDec ->
        let
            nP = mdl.page - 1
            newM = { mdl | page = nP }
        in
            ( newM, P.pageDecrease nP )




view : Model -> Brs.Document Msg
view mdl =
    { title = "Echo back"
    , body  = [buildHtml mdl]
    }

buildHtml mdl =
    let
        urlArea = H.form [ class "urlarea", onSubmit LoadPdf ]
                         [ input [ placeholder "input url here"
                                 , onInput  ChangeUrl
                                 , value mdl.url
                                 , class "inputtext"
                                 ] []
                         ]
        btn = button [onClick LoadPdf] [H.text "load"]
        hist = div [class "history"] <| buildHist mdl.history
        txtLay = div [id "textLayer"] []
        cnv = div [class "cnv"]
            [ Cnv.toHtml (200,200) [id "the-canvas"] []
            , txtLay
            ]
        pdfarea = div [class "pdfarea"] [cnv]
        shiftPageI = button [onClick PageInc] [H.text ">"]
        shiftPageD = button [onClick PageDec] [H.text "<"]

        con = div [class "content"] [ hist
                                    , pdfarea
                                    ]
        h = header [] [ urlArea
                      , btn
                      ]
        f = footer [] [ shiftPageD
                      , div [class "page"] [H.text <| String.fromInt mdl.page]
                      , shiftPageI
                      ]
    in
        div [ class "root"] [ h
                            , con
                            , f
                            ]

buildHist hs = case List.head hs of
    Nothing ->
        []
    Just s ->
        (div [class "histelem"] [H.text s]) :: buildHist (List.drop 1 hs)
