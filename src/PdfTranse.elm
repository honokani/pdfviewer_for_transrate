module PdfTranse exposing (Flags, Model, Msg, program)

-- common modules
import Browser            as Brs
import Browser.Navigation as Nav
import Html               as H   exposing (..)
import Html.Attributes           exposing (..)
import Html.Events               exposing (onClick, onInput, onSubmit)
import Http
-- canvas
import Canvas             as Cnv exposing (..)
import Color
-- my modules
import Port               as P



type alias Flags = Maybe Int

type alias Model =
    { page : Int
    , url : String
    , w_flgs : List Bool
    , words : List String
    }

type Msg
    = Undef
    | LoadPdf
    | SendWords
    | DelWords
    | ToggleWordFlg Int
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
        ( Model p "" [] []
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
    ToggleWordFlg n ->
        let
            n_a = List.take n mdl.w_flgs
            n_b = List.drop n mdl.w_flgs
            n_bh = Maybe.map not <| List.head n_b
            n_bt = List.tail n_b
            new_f = Maybe.map (List.append n_a) <| Maybe.map2 (::) n_bh n_bt
            newM = { mdl | w_flgs = Maybe.withDefault mdl.w_flgs new_f}
        in
            ( newM, Cmd.none)
    SendWords ->
        let
            (wt, _) = List.partition (\(_,y) -> y) <| zip mdl.words mdl.w_flgs
            tgt = List.map Tuple.first wt
        in
            ( mdl, P.sendWordsToFB tgt)
    DelWords ->
        let
            (_, wf) = List.partition (\(_,y) -> y) <| zip mdl.words mdl.w_flgs
            leave = List.map Tuple.first wf
            l_f = List.repeat (List.length leave) False
            newM = { mdl | words = leave, w_flgs = l_f}
        in
            ( newM, Cmd.none)
    ChangeUrl s ->
        let
            newM = { mdl | url = s}
        in
            ( newM, Cmd.none )
    GotFocusedStr mayStr -> case mayStr of
        Just s ->
            let
                s_fixed = String.toLower <| String.trim s
                new_w = if List.member s_fixed mdl.words
                    then mdl.words
                    else s_fixed :: mdl.words
                newM = { mdl | words = new_w, w_flgs = False :: mdl.w_flgs}
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
        urlbtn = button [onClick LoadPdf] [H.text "load"]

        nav = div [class "nav"] [ hist, btnset ]
        hist = div [class "words"] <| buildHist <| enumerate <| zip mdl.w_flgs mdl.words
        btnset = div [class "btnset"] [ delbtn
                                      , sndbtn
                                      ]
        sndbtn = button [onClick SendWords] [H.text "send"]
        delbtn = button [onClick DelWords] [H.text "Del"]
        pdfarea = div [class "pdfarea"] [cnv]
        cnv = div [class "cnv"]
            [ Cnv.toHtml (200,200) [id "the-canvas"] []
            , txtLay
            ]
        txtLay = div [id "textLayer"] []
        shiftPageI = button [onClick PageInc] [H.text ">"]
        shiftPageD = button [onClick PageDec] [H.text "<"]

        con = div [class "content"] [ nav
                                    , pdfarea
                                    ]
        head = header [] [ urlArea
                         , urlbtn
                         ]
        foot = footer [] [ shiftPageD
                         , div [class "page"] [H.text <| String.fromInt mdl.page]
                         , shiftPageI
                         ]
    in
        div [ class "root"] [ head
                            , con
                            , foot
                            ]


enumerate l = List.indexedMap Tuple.pair l
zip l r = List.map2 Tuple.pair l r


buildHist hs = case List.head hs of
    Nothing ->
        []
    Just (n, (b, s)) ->
        let
            line = makeLine b s
        in
            (div [class "histelem", onClick <| ToggleWordFlg n] [H.text line]) :: buildHist (List.drop 1 hs)

makeLine b s = (if b then "[x] " else "[_] ") ++ s

