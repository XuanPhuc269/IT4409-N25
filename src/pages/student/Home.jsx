import React from 'react'
import Companies from '../../components/student/Companies'
import CourseSection from '../../components/student/CoursesSection'
import CallToAction from '../../components/student/CallToAction'
import Footer from '../../components/student/Footer'

const Home = () => {
  return (
    <div className='flex flex-col items-center space-y-7 text-center'>
      <Companies/>
      <CourseSection/>
      <CallToAction/>
      <Footer/>
    </div>
  )
}

export default Home