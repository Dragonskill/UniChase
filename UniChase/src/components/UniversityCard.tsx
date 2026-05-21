import './UniversityCard.css'

type University = {
  id: number
  name: string
  location: string
  image: string
  logo: string
  description: string
}

function UniversityCard({ uni }: { uni: University }) {
  return (
    <div className="card">
      <img className="card-image" src={uni.image} alt={uni.name} />
      <img className="card-logo" src={uni.logo} alt={uni.name + " logo"} />
      <h2 className="card-name">{uni.name}</h2>
      <p className="card-location">📍 {uni.location}</p>
      <p className="card-description">{uni.description}</p>
    </div>
  )
}

export default UniversityCard
