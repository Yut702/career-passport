import { useEffect } from "react";
import RouterComponent from "./router";
import { storage } from "./lib/storage";

export default function App() {
  useEffect(() => {
    // アプリ起動時にコントラクトアドレスのバージョンチェック
    const wasCleared = storage.checkContractVersion();
    if (wasCleared) {
      console.log(
        "コントラクトアドレスが変更されたため、ローカルストレージをクリアしました"
      );
    }
  }, []);

  return <RouterComponent />;
}
