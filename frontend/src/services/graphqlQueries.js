export const GET_BOOKS = `
  query GetBooks($page: Int, $size: Int, $categoryId: ID, $keyword: String) {
    books(page: $page, size: $size, categoryId: $categoryId, keyword: $keyword) {
      content {
        id
        title
        isbn
        description
        coverImage
        price
        totalCopies
        availableCopies
        publishYear
        shelfLocation
        rating
        category {
          id
          name
        }
        author {
          id
          name
        }
        publisher {
          id
          name
        }
      }
      totalElements
      totalPages
      currentPage
    }
  }
`;

export const GET_BOOK_BY_ID = `
  query GetBookById($id: ID!) {
    bookById(id: $id) {
      id
      title
      isbn
      description
      coverImage
      price
      totalCopies
      availableCopies
      publishYear
      shelfLocation
      rating
      category {
        id
        name
      }
      author {
        id
        name
        bio
      }
      publisher {
        id
        name
      }
      reviews {
        id
        rating
        comment
        createdAt
        user {
          id
          fullName
          avatar
        }
      }
    }
  }
`;

export const GET_CATEGORIES = `
  query GetCategories {
    categories {
      id
      name
      description
      icon
      bookCount
    }
    authors {
      id
      name
    }
    publishers {
      id
      name
    }
  }
`;

export const GET_MY_BORROWINGS = `
  query GetMyBorrowings {
    myBorrowRecords {
      id
      borrowCode
      borrowDate
      dueDate
      returnDate
      status
      fineAmount
      notes
      book {
        id
        title
        coverImage
        shelfLocation
        price
      }
    }
  }
`;

export const GET_ALL_BORROW_RECORDS = `
  query GetAllBorrowRecords($status: String, $keyword: String) {
    allBorrowRecords(status: $status, keyword: $keyword) {
      id
      borrowCode
      borrowDate
      dueDate
      returnDate
      status
      fineAmount
      notes
      user {
        id
        fullName
        email
        phone
      }
      book {
        id
        title
        shelfLocation
        price
      }
    }
  }
`;

export const GET_DASHBOARD_STATS = `
  query GetDashboardStats {
    dashboardStats {
      totalBooks
      totalReaders
      activeBorrowings
      overdueBorrowings
      totalRevenue
      recentBorrows {
        id
        borrowCode
        borrowDate
        dueDate
        status
        fineAmount
        user {
          fullName
        }
        book {
          title
        }
      }
      popularBooks {
        id
        title
        coverImage
        rating
        totalCopies
        availableCopies
      }
    }
    payments {
      id
      transactionId
      amount
      paymentMethod
      status
      paymentDate
      orderInfo
      user {
        fullName
        email
      }
      borrowRecord {
        id
        borrowCode
        book {
          title
        }
      }
    }
  }
`;

export const REQUEST_BORROW = `
  mutation RequestBorrow($bookId: ID!, $days: Int, $note: String) {
    requestBorrow(bookId: $bookId, days: $days, note: $note) {
      id
      borrowCode
      borrowDate
      dueDate
      status
    }
  }
`;

export const APPROVE_BORROW = `
  mutation ApproveBorrow($recordId: ID!) {
    approveBorrow(recordId: $recordId) {
      id
      status
    }
  }
`;

export const RETURN_BOOK = `
  mutation ReturnBook($recordId: ID!, $damaged: Boolean, $lost: Boolean) {
    returnBook(recordId: $recordId, damaged: $damaged, lost: $lost) {
      id
      status
      returnDate
      fineAmount
    }
  }
`;

export const RENEW_BORROW = `
  mutation RenewBorrow($recordId: ID!, $extraDays: Int) {
    renewBorrow(recordId: $recordId, extraDays: $extraDays) {
      id
      dueDate
      status
    }
  }
`;

export const CREATE_BOOK = `
  mutation CreateBook($input: BookInput!) {
    createBook(input: $input) {
      id
      title
    }
  }
`;

export const UPDATE_BOOK = `
  mutation UpdateBook($id: ID!, $input: BookInput!) {
    updateBook(id: $id, input: $input) {
      id
      title
    }
  }
`;

export const DELETE_BOOK = `
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id)
  }
`;

export const AI_CHAT = `
  query AiChat($message: String!) {
    aiChat(message: $message) {
      reply
      suggestedTopics
      recommendedBooks {
        id
        title
        coverImage
        rating
        shelfLocation
        category {
          name
        }
      }
    }
  }
`;

export const GET_USERS = `
  query GetUsers {
    users {
      id
      email
      fullName
      phone
      avatar
      role
      provider
      enabled
      createdAt
    }
  }
`;

export const UPDATE_USER_ROLE = `
  mutation UpdateUserRole($userId: ID!, $role: String!) {
    updateUserRole(userId: $userId, role: $role) {
      id
      role
    }
  }
`;

export const TOGGLE_USER_STATUS = `
  mutation ToggleUserStatus($userId: ID!) {
    toggleUserStatus(userId: $userId) {
      id
      enabled
    }
  }
`;

export const ADD_REVIEW = `
  mutation AddReview($bookId: ID!, $rating: Int!, $comment: String) {
    addReview(bookId: $bookId, rating: $rating, comment: $comment) {
      id
      rating
      comment
    }
  }
`;
