import React from 'react'
import Companies from '../../components/student/Companies'
import CourseSection from '../../components/student/CoursesSection'

const Home = () => {
  return (
    <div className='flex flex-col items-center space-y-7 text-center'>
      <Companies/>
      <CourseSection/>
    </div>
  )
}

export default Home