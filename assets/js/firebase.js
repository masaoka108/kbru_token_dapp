const firebaseConfig = {
  apiKey: "AIzaSyCeG7Ak-8UgNYDSHnzQD53A0zTHPc6AKmM",
  authDomain: "kbru-test.firebaseapp.com",
  projectId: "kbru-test",
  storageBucket: "kbru-test.appspot.com",
  messagingSenderId: "372804501342",
  appId: "1:372804501342:web:8b8c7af9468b3b6e0359cf",
  measurementId: "G-EF2405NTQN"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
var storage = firebase.storage();


async function getUserInfo(address) {
  _userInfo = {}

  return new Promise(async (resolve, reject) => {

    try {

      const querySnapshot = await db.collection("users").where("walletAddress", "==", address).get()
        .then(querySnapshot => {
            console.log('thenの中')
            querySnapshot.forEach((doc) => {

              console.log(doc.id, " => ", doc.data());
              _userInfo = doc.data()
              _userInfo.docId = doc.id
          });
          resolve(_userInfo)
        })
    
    } catch (error) {
      console.log("Error getting documents: ", error);
    }
  })
}


async function setNickname(nickname) {
  $("#username").html(`(${nickname})`)
}

async function createUser(userData) {
  try {
    const db = firebase.firestore();
    const docRef = await db.collection("users").add(userData);
    console.log("CreateUser Document written with ID: ", docRef.id);

    await setNickname($('#nickname').val())
    setProfileImg(userData.profilePhoto)

    showMsg()
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

async function putStorage(file) {

    //ファイルの参照
    var storageRef = firebase.storage().ref();

    //ファイルのメタデータ
    var metadata = {
      contentType: "image/*",
    };          

    //画像ファイルのアップロード
    profileImagePath = ""

    const uploadTask = storageRef.child("profile/" + file.name).put(file, metadata);
    console.log(uploadTask);

    uploadTask.on(
      "state_changed",
      function (snapshot) {
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log("Upload is paused");
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log("Upload is running");
            break;
        }
        if (progress === 100 && flg === 0) {
          console.log("100%です。");
          profileImagePath = snapshot.metadata.fullPath

          // var display = document.querySelector(".disN");
          // display.classList.replace("disN", "disB");
          flg = 1;


          // データを Firestoreに登録
          userData = {
            nickname: $('#nickname').val(),
            walletAddress: user,
            profilePhoto: profileImagePath
          }

          createUser(userData)

        }
      },
      function (error) {
        switch (error.code) {
          case "storage/unauthorized":
            // User doesn't have permission to access the object
            console.log(
              "目的の操作を行う権限がユーザーにありません。セキュリティ ルールが正しいことをご確認ください。"
            );
            break;

          case "storage/canceled":
            // User canceled the upload
            console.log("ユーザーがオペレーションをキャンセルしました。");
            break;

          case "storage/unknown":
            // Unknown error occurred, inspect error.serverResponse
            console.log("不明なエラーが発生しました。");
            break;
          default:
            console.log("error");
            break;
        }
      }
    );

  // return profileImagePath

}

async function createTokenHistory(from, to, value) {

  (async () => {
    try {
      const db = firebase.firestore();
      const docRef = await db.collection("tokenHistories").add({
        from: from,
        to: to,
        value: value,
        createdAt: getNow(),
        updatedAt: getNow()
      });
      console.log("createTokenHistory Document written with ID: ", docRef.id);

    } catch (error) {
      console.error("Error adding document: ", error);
    }
  })();
}


async function updateUser(address, updateData){

  try {
    const db = firebase.firestore();

    const querySnapshot = await db.collection("users").where("walletAddress", "==", address.toLowerCase()).get()
      .then(querySnapshot => {
          querySnapshot.forEach((doc) => {

            console.log(doc.id, " => ", doc.data());

            var userRef = db.collection("users").doc(doc.id);
      
            return userRef.update(updateData)
            .then(() => {
                console.log("Document successfully updated!");
            })
            .catch((error) => {
                // The document probably doesn't exist.
                console.error("Error updating document: ", error);
            });

        });
          return null;
      })
    
  } catch (error) {
    console.error("Error adding document: ", error);
  }


}