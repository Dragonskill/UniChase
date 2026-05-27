export type University = {
  id: number
  name: string
  location: string
  image: string
  logo: string
  description: string
  mainColor: string
  acceptanceRate?: string
  qsRanking?: string
}

export const universities: University[] = [
  {
    id: 1,
    name: "Seoul National University",
    location: "Seoul",
    image: "https://en.snu.ac.kr/webdata/eng/gallery/thumb/fb9z62dzd5fz1dbz925z112zdf6z1b3zf30z304zfd.jpg",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/77/Seoul_national_university_emblem.svg",
    description: "SNU, founded in 1946, is one of the most prestigious universities in Korea.",
    mainColor: "#15397F",
    acceptanceRate: "12%",
    qsRanking: "29",
  },
  {
    id: 2,
    name: "Korea University",
    location: "Seoul",
    image: "https://uploaded.kcampus.kr/1_5f0ebd83_623d_4f9c_9556_52c82dbd5a15_0de2b3e5f9.jpg",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Korea_University_Global_Symbol.svg/960px-Korea_University_Global_Symbol.svg.png",
    description: "Korea University (KU) is one of South Korea’s oldest and most prestigious universities.",
    mainColor: "#ce1414",
    acceptanceRate: "9%",
    qsRanking: "66",
  },
  {
    id: 3,
    name: "Yonsei",
    location: "Seoul",
    image: "https://www.yonsei.ac.kr/sites/sc/atchmnfl_mngr/imageSlide/73/temp_1750298387242100.jpg",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/95/YonseiUniversityEmblem.svg/1280px-YonseiUniversityEmblem.svg.png",
    description: "Yonsei University is one of South Korea's most prestigious universities and a member of the elite SKY universities.",
    mainColor: "#0b24df",
    acceptanceRate: "6%",
    qsRanking: "55",
  },
  {
    id: 4,
    name: "Kaist",
    location: "Daegu",
    image: "https://ingiehonglab.org/wp-content/uploads/2025/09/KAIST.png",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0a/KAIST_logo.svg",
    description: "Yonsei University is one of South Korea's most prestigious universities and a member of the elite SKY universities.",
    mainColor: "#263ce0",
    acceptanceRate: "6%",
    qsRanking: "55",
  }
  
]
