port module Port exposing (..)

-- in
port sendFocusedStr : (Maybe String -> msg) -> Sub msg
-- out
port loadPdfFile : String -> Cmd msg
port pageIncrease : Int -> Cmd msg
port pageDecrease : Int -> Cmd msg
port sendWordsToFB : List String -> Cmd msg

